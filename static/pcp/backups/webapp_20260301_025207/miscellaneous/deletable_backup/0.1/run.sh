#!/usr/bin/env bash

set -e

echo "🚀 Setting up AdminLTE + Puck CMS dashboard..."

# Initialise npm
if [ ! -f package.json ]; then
  npm init -y
fi

# Install dependencies
npm install admin-lte bootstrap @fortawesome/fontawesome-free \
react react-dom @measured/puck esbuild

# Create admin directory
mkdir -p admin

########################################
# Create AdminLTE dashboard shell
########################################

cat > admin/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Admin Dashboard</title>

  <link rel="stylesheet" href="../node_modules/admin-lte/dist/css/adminlte.min.css">
  <link rel="stylesheet" href="../node_modules/@fortawesome/fontawesome-free/css/all.min.css">
</head>

<body class="hold-transition sidebar-mini dark-mode">
<div class="wrapper">

  <!-- Navbar -->
  <nav class="main-header navbar navbar-expand navbar-dark">
    <ul class="navbar-nav">
      <li class="nav-item">
        <span class="nav-link">Admin Dashboard</span>
      </li>
    </ul>
  </nav>

  <!-- Sidebar -->
  <aside class="main-sidebar sidebar-dark-primary elevation-4">
    <a href="#" class="brand-link text-center">
      <span class="brand-text font-weight-light">My CMS</span>
    </a>
  </aside>

  <!-- Content -->
  <div class="content-wrapper p-4">
    <section class="content">
      <div id="puck-root"></div>
    </section>
  </div>

</div>

<script src="../node_modules/admin-lte/dist/js/adminlte.min.js"></script>
<script src="./puck.js"></script>

<style>
#puck-root {
  background: #1f2d3d;
  padding: 20px;
  border-radius: 8px;
}
</style>

</body>
</html>
EOF

########################################
# Create Puck Editor React File
########################################

cat > admin/puck-editor.jsx <<'EOF'
import React from "react";
import { createRoot } from "react-dom/client";
import { Puck } from "@measured/puck";

const config = {
  components: {
    Heading: {
      fields: {
        text: { type: "text" }
      },
      render: ({ text }) => (
        <h2 style={{ color: "white" }}>{text}</h2>
      )
    }
  }
};

const data = {
  content: [
    {
      type: "Heading",
      props: { text: "Hello from Puck inside AdminLTE" }
    }
  ]
};

const root = createRoot(document.getElementById("puck-root"));

root.render(<Puck config={config} data={data} />);
EOF

########################################
# Build with esbuild
########################################

npx esbuild admin/puck-editor.jsx \
  --bundle \
  --outfile=admin/puck.js \
  --format=iife \
  --loader:.js=jsx \
  --minify

echo ""
echo "✅ Setup complete."
echo ""
echo "👉 Open your dashboard at:"
echo "   http://localhost/admin/index.html"
echo ""
echo "If deployed on a server:"
echo "   https://yourdomain.com/admin/index.html"
echo ""
