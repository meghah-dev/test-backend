const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const os = require("os");

// Swagger imports
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (update to Atlas if needed)
mongoose.connect("mongodb://127.0.0.1:27017/todos")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Todo Schema & Model
const TodoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
});
const Todo = mongoose.model("Todo", TodoSchema);

// --------------------
// Swagger setup
// --------------------

// Get public IP dynamically from env or fallback to localhost
const publicIP = process.env.PUBLIC_IP || "localhost";

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Todo API",
      version: "1.0.0",
      description: "Simple Todo API with Express and MongoDB",
    },
    servers: [
      { url: `http://${publicIP}:5000` }, // dynamic IP
    ],
  },
  apis: ["./index.js"], // this file
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// --------------------
// Routes
// --------------------

// Test route
app.get("/test", (req, res) => res.send("API is working"));

// Get all todos
app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new todo
app.post("/todos", async (req, res) => {
  try {
    if (!req.body.text) return res.status(400).json({ error: "Text is required" });
    const todo = new Todo({ text: req.body.text });
    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle completed
app.put("/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ error: "Todo not found" });
    todo.completed = !todo.completed;
    await todo.save();
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete todo
app.delete("/todos/:id", async (req, res) => {
  try {
    await Todo.findByIdAndDelete(req.params.id);
    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// Start server
// --------------------
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
  console.log(`Swagger docs available at http://${publicIP}:5000/api-docs`);
});
