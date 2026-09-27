const MAX_FILE_BYTES = 4 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async (req) => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Netlify Function is working"
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    }
  );
};

  // Keep HRMS credentials server-side in Netlify environment variables.
  const hrmsUrl = process.env.HRMS_API_URL;
  const hrmsToken = process.env.HRMS_API_TOKEN;

  if (!hrmsUrl || !hrmsToken) {
    return jsonResponse(500, {
      error:
        "HRMS integration is not configured. HRMS_API_URL and HRMS_API_TOKEN are not set.",
    });
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return jsonResponse(400, {
      error: "Expected a multipart/form-data request.",
    });
  }

  try {
    // Netlify's current Functions runtime uses the standard Web Request API.
    // Request.formData() lets us receive the uploaded CV without exposing
    // the HRMS token to the browser.
    const form = await request.formData();

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const experience = String(form.get("experience") || "").trim();
    const location = String(form.get("location") || "").trim();
    const coverNote = String(form.get("cover_note") || "").trim();
    const jobId = String(form.get("job_id") || "").trim();
    const jobTitle = String(form.get("job_title") || "").trim();
    const source = String(form.get("source") || "external_job_portal").trim();

    const resume = form.get("resume");

    if (!(resume instanceof File)) {
      return jsonResponse(400, { error: "Resume file is required." });
    }

    if (!ALLOWED_TYPES.has(resume.type)) {
      return jsonResponse(400, {
        error: "Only PDF, DOC, and DOCX resumes are accepted.",
      });
    }

    if (resume.size <= 0) {
      return jsonResponse(400, { error: "Resume file is empty." });
    }

    if (resume.size > MAX_FILE_BYTES) {
      return jsonResponse(413, {
        error: "Resume exceeds the 4 MB simulator limit.",
      });
    }

    // Forward the application as multipart/form-data to the HRMS.
    // The field names can be adjusted once we inspect the HRMS endpoint.
    const outgoing = new FormData();
    outgoing.append("source", source);
    outgoing.append("job_id", jobId);
    outgoing.append("job_title", jobTitle);
    outgoing.append("name", name);
    outgoing.append("email", email);
    outgoing.append("phone", phone);
    outgoing.append("experience", experience);
    outgoing.append("location", location);
    outgoing.append("cover_note", coverNote);
    outgoing.append("resume", resume, resume.name);

    const hrmsResponse = await fetch(hrmsUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hrmsToken}`,
      },
      body: outgoing,
    });

    const responseText = await hrmsResponse.text();

    let hrmsBody;
    try {
      hrmsBody = JSON.parse(responseText);
    } catch {
      hrmsBody = { raw: responseText.slice(0, 2000) };
    }

    if (!hrmsResponse.ok) {
      return jsonResponse(502, {
        error: "HRMS API rejected the application.",
        hrms_status: hrmsResponse.status,
        hrms_response: hrmsBody,
      });
    }

    return jsonResponse(200, {
      success: true,
      message: "Application forwarded to HRMS successfully.",
      hrms_response: hrmsBody,
    });
  } catch (error) {
    return jsonResponse(500, {
      error: error?.message || "Could not process the application.",
    });
  }
};
