const tf = require("@tensorflow/tfjs-node");

async function predict(model, imageBuffer) {
  try {
    // Decode image
    const tensor = tf.node
      .decodeImage(imageBuffer, 3) // Decode image with 3 channels (RGB)
      .resizeNearestNeighbor([150, 150])
      .expandDims()
      .toFloat()
      .div(tf.scalar(255)); // Normalize the image data

    // Predict
    const prediction = await model.predict(tensor).data();

    return prediction;
  } catch (error) {
    console.error("Error in predict function:", error);
    throw error;
  }
}

module.exports = { loadModel, predict };
