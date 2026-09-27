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
