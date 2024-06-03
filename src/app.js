const Hapi = require("@hapi/hapi");
const fs = require("fs");
const path = require("path");
const { loadModel, predict } = require("./inference");

(async () => {
  try {
    // Load and get machine learning model
    const model = await loadModel();
    console.log("Model loaded!");

    // Initialize HTTP server
    const server = Hapi.server({
      host: process.env.NODE_ENV !== "production" ? "localhost" : "0.0.0.0",
      port: 3000,
    });

    server.route({
      method: "POST",
      path: "/predicts",
      handler: async (request, h) => {
        try {
          // Get image uploaded by user
          const { image } = request.payload;

          // Check if the image is received correctly
          if (!image) {
            console.log("No image received in the payload");
            return h.response({ error: "Image file is required" }).code(400);
          }

          // Read the image file as a buffer
          const imageBuffer = await new Promise((resolve, reject) => {
            const chunks = [];
            image.on("data", (chunk) => chunks.push(chunk));
            image.on("end", () => resolve(Buffer.concat(chunks)));
            image.on("error", reject);
          });

          console.log("Received image:", image.hapi.filename);

          // Perform prediction using the model and image
          const predictions = await predict(model, imageBuffer);

          console.log("Predictions:", predictions);

          // Get prediction result
          const [paper, rock, scissors] = predictions;

          // Determine the result based on the highest prediction score
          const maxPrediction = Math.max(paper, rock, scissors);
          let result = "scissors"; // Default result if none of the above conditions match

          if (maxPrediction === paper) {
            result = "paper";
          } else if (maxPrediction === rock) {
            result = "rock";
          }

          return { result };
        } catch (error) {
          console.error("Error during prediction:", error);
          return h
            .response({
              error: "Failed to process prediction",
              details: error.message,
            })
            .code(500);
        }
      },
      // Configure payload to accept `multipart/form-data` for file uploads
      options: {
        payload: {
          allow: "multipart/form-data",
          multipart: true,
          maxBytes: 10485760, // 10 MB limit for file size
          output: "stream", // Use 'stream' to handle file uploads
          parse: true, // Parse multipart payload
        },
      },
    });

    // Start the server
    await server.start();
    console.log(`Server started at: ${server.info.uri}`);
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
})();
