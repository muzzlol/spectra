# Excalidraw Multi-User App

## Overview

This is a real-time collaborative drawing application built with Excalidraw that allows multiple users to draw together simultaneously. The application leverages WebSockets for bidirectional communication, enabling users to see each other's cursor movements and drawing changes in real-time without page refreshes.

Key features include:
- Real-time collaboration via WebSockets connections
- Live cursor position tracking across multiple clients
- Synchronized drawing elements between users
- Persistent state management with Cloudflare Durable Objects

The architecture uses Cloudflare's infrastructure to manage WebSocket connections efficiently, broadcasting updates between clients and maintaining drawing state across sessions.

This project consists of two applications:
1. A backend service (excalidraw-backend) built with Cloudflare Workers and Durable Objects
2. A frontend application (excalidraw-multi-user-state) built with React and Excalidraw
