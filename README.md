# 🖨️ 3D Printer Slicer Visualizer

A visualization tool for 3D printing workflows, focused on intelligent model placement and geometry-based preprocessing before slicing.

---

## 📌 Overview

This project focuses on the **pre-slicing stage** of 3D printing, where models are prepared for optimal printing.

It provides automatic orientation and placement of 3D models using custom geometry algorithms, improving print stability and efficiency.

---

## 🧠 Key Idea

Before slicing begins, models must be:

* Properly oriented
* Placed flat on the build plate
* Optimized for stability

This project automates that process using **custom-developed algorithms**.

---

## ✨ Features

### 🔷 Automatic Model Orientation (Auto-Rotate)

* Detects the most stable orientation of a 3D model
* Rotates the model to align its **largest face with the build plate**
* Fully custom algorithm (developed from scratch)

---

### 🔶 Auto Lay Flat

* Ensures models are properly seated on the build surface
* Eliminates floating or misaligned geometries
* Improves print reliability

---

### 🔷 Convex Hull-Based Geometry Processing

* Uses **convex hull computation (Three.js)**
* Helps determine optimal orientation and face detection
* Core part of the custom placement algorithm

---

### 🔶 Multiple Model Import

* Supports importing multiple parts into the workspace
* Each model is automatically:

  * Rotated
  * Flattened
  * Positioned

---

## 🏗️ Tech Stack


* **3D Engine:** Three.js
* **Geometry Processing:** Convex Hull algorithms


---


---

## ⚙️ Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/TejaNathi/3D-PRINTER-SLICER-VISUALIZER.git
cd 3D-PRINTER-SLICER-VISUALIZER
```

---



---

### 3. Run Web Visualization (if applicable)

```bash
cd web
# serve or run your web build
```

---

## 🔍 How It Works

1. Import one or more 3D models
2. Compute geometry (convex hull)
3. Detect largest stable face
4. Automatically rotate model
5. Lay model flat on build plate

---

## 🚧 Upcoming Features

* 🧾 G-code generation and visualization
* 🧩 Layer-by-layer slicing preview
* 📊 Toolpath simulation
* ⚙️ Print parameter optimization

---

## 🧪 Engineering Focus

This project explores:

* Computational geometry
* Convex hull algorithms
* Orientation optimization
* Pre-processing for additive manufacturing

---

## 👨‍💻 Author

**Teja Nathi**

---

## 💡 Note

This project is part of a deeper effort to understand and build the full 3D printing pipeline—from geometry processing to motion execution.
