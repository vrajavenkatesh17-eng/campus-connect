import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Process Event Reminders via Atomic & Idempotent RPC
    // process_event_reminders() finds events starting in 24h & 1h, inserts in-app notifications,
    // and updates reminder_24h_sent = true and reminder_1h_sent = true.
    const { data: reminderResult, error: reminderError } = await supabase.rpc(
      "process_event_reminders"
    );

    if (reminderError) {
      console.error("Error executing process_event_reminders RPC:", reminderError);
      throw reminderError;
    }

    // 2. Optional: Send Email Reminders via Free-tier Email Provider (e.g., Resend)
    // If RESEND_API_KEY is configured in Supabase secrets, send external emails.
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailsSent = 0;

    if (resendApiKey) {
      // Find unnotified emails for upcoming events starting soon
      const { data: upcomingEvents, error: evErr } = await supabase
        .from("events")
        .select(`
          id,
          title,
          start_time,
          venue:venue_id(name),
          registrations:registrations(
            student:student_id(email, name)
          )
        `)
        .eq("status", "approved")
        .gte("start_time", new Date().toISOString())
        .lte("start_time", new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

      if (!evErr && upcomingEvents) {
        for (const ev of upcomingEvents) {
          const registeredStudents = ev.registrations || [];
          for (const reg of registeredStudents) {
            const student = reg.student;
            if (student?.email) {
              try {
                const emailRes = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendApiKey}`,
                  },
                  body: JSON.stringify({
                    from: "FXEC Campus Connect <notifications@campusconnect.fxec.ac.in>",
                    to: [student.email],
                    subject: `Reminder: "${ev.title}" starting soon at FXEC`,
                    html: `
                      <div style="font-family: sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #800020;">Francis Xavier Engineering College</h2>
                        <h3>Upcoming Guest Lecture Reminder</h3>
                        <p>Dear ${student.name || "Student"},</p>
                        <p>This is a reminder that your registered guest lecture <strong>"${ev.title}"</strong> is scheduled for:</p>
                        <p style="background: #f8fafc; padding: 12px; border-left: 4px solid #800020;">
                          <strong>Time:</strong> ${new Date(ev.start_time).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}<br/>
                          <strong>Venue:</strong> ${ev.venue?.name || "Campus Auditorium"}
                        </p>
                        <p>Please arrive 10 minutes early to scan the 30-second live QR attendance token.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 11px; color: #94a3b8;">FXEC Campus Connect • Automated Event Operations</p>
                      </div>
                    `,
                  }),
                });
                if (emailRes.ok) emailsSent++;
              } catch (e) {
                console.warn(`Could not dispatch email to ${student.email}:`, e);
              }
            }
          }
        }
      }
    }

    // 3. Database Keep-Alive Verification Ping
    const { data: pingData } = await supabase
      .from("app_settings")
      .select("key")
      .limit(1);

    return new Response(
      JSON.stringify({
        success: true,
        reminder_stats: reminderResult,
        emails_dispatched: emailsSent,
        database_ping: "active",
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
