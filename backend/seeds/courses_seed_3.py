#!/usr/bin/env python3
"""Seed 12 more courses - mix of free and premium (Pro)."""
import sys, requests

API_URL = sys.argv[1]
TOKEN = sys.argv[2]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

COURSES = [
    {
        "title": "Deep Learning with PyTorch",
        "description": "Master deep learning using PyTorch. Build CNNs, RNNs, GANs, and transformers from scratch. Learn model training, optimization, transfer learning, and deploy models to production.",
        "category": "AI", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Alfredo Canziani", "instructor_avatar": "https://randomuser.me/api/portraits/men/51.jpg",
        "instructor_title": "NYU Professor of Deep Learning",
        "thumbnail": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
        "tags": ["Deep Learning", "PyTorch", "CNN", "RNN", "Premium"],
        "what_you_learn": ["Build neural networks with PyTorch", "Train CNNs for image recognition", "Implement RNNs for sequence data", "Deploy models to production"],
        "prerequisites": ["Python proficiency", "Linear algebra basics", "ML fundamentals"],
        "estimated_hours": 15, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "PyTorch for Deep Learning - Full Course", "video_url": "https://www.youtube.com/watch?v=V_xro1bcAuQ", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is PyTorch?", "options": ["A Python web framework", "An open-source deep learning framework by Meta", "A data visualization tool", "A database"], "correct_answer": 1, "explanation": "PyTorch is Meta's open-source deep learning framework known for dynamic computation graphs and Pythonic design."},
                      {"question": "What is a tensor in PyTorch?", "options": ["A string type", "A multi-dimensional array similar to NumPy arrays but with GPU support", "A function", "A class name"], "correct_answer": 1, "explanation": "Tensors are PyTorch's fundamental data structure — multi-dimensional arrays that can run on GPUs for fast computation."},
                      {"question": "What is autograd?", "options": ["Auto-grading system", "PyTorch's automatic differentiation engine for computing gradients", "A code formatter", "A deployment tool"], "correct_answer": 1, "explanation": "Autograd automatically computes gradients of tensors, enabling backpropagation for training neural networks."}]},
            {"title": "Convolutional Neural Networks Explained", "video_url": "https://www.youtube.com/watch?v=YRhxdVk_sIs", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What are CNNs best suited for?", "options": ["Text processing", "Image and spatial data processing", "Time series only", "Audio only"], "correct_answer": 1, "explanation": "CNNs excel at processing grid-like data such as images, using convolutional layers to detect spatial patterns."},
                      {"question": "What is a convolutional layer?", "options": ["A fully connected layer", "A layer that applies filters to detect features in input data", "An output layer", "A normalization layer"], "correct_answer": 1, "explanation": "Convolutional layers slide learnable filters across input data to detect features like edges, textures, and objects."},
                      {"question": "What is pooling?", "options": ["Combining datasets", "Downsampling feature maps to reduce dimensions while keeping key features", "Data augmentation", "Batch processing"], "correct_answer": 1, "explanation": "Pooling reduces spatial dimensions of feature maps, making the network more efficient and translation-invariant."}]},
            {"title": "Transfer Learning & Model Deployment", "video_url": "https://www.youtube.com/watch?v=K0lWSB2QoIQ", "duration": "25 min", "type": "video", "order": 2,
             "quiz": [{"question": "What is transfer learning?", "options": ["Moving data between servers", "Using a pre-trained model as a starting point for a new task", "Copying code", "Data migration"], "correct_answer": 1, "explanation": "Transfer learning leverages knowledge from a model trained on a large dataset and applies it to a new, related task."},
                      {"question": "Why use transfer learning?", "options": ["It's required", "Saves training time and works well with limited data", "It's faster to code", "No advantage"], "correct_answer": 1, "explanation": "Transfer learning significantly reduces training time and data requirements by building on pre-learned features."}]}
        ]
    },
    {
        "title": "System Design for Engineers",
        "description": "Learn how to design scalable, reliable distributed systems. Cover load balancing, caching, databases, message queues, microservices, and real-world architecture patterns used by top tech companies.",
        "category": "Software Engineering", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Alex Xu", "instructor_avatar": "https://randomuser.me/api/portraits/men/77.jpg",
        "instructor_title": "Author of System Design Interview",
        "thumbnail": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
        "tags": ["System Design", "Architecture", "Scalability", "Premium"],
        "what_you_learn": ["Design scalable distributed systems", "Load balancing and caching strategies", "Database sharding and replication", "Microservices architecture patterns"],
        "prerequisites": ["Software development experience", "Basic networking knowledge"],
        "estimated_hours": 12, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "System Design Full Course", "video_url": "https://www.youtube.com/watch?v=MbjObHmDbZo", "duration": "50 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is horizontal scaling?", "options": ["Adding more RAM", "Adding more servers to handle load", "Upgrading CPU", "Increasing storage"], "correct_answer": 1, "explanation": "Horizontal scaling adds more machines to distribute load, vs vertical scaling which upgrades a single machine."},
                      {"question": "What is a load balancer?", "options": ["A database optimizer", "A component that distributes traffic across multiple servers", "A caching layer", "A monitoring tool"], "correct_answer": 1, "explanation": "A load balancer distributes incoming requests across multiple servers to ensure no single server is overwhelmed."},
                      {"question": "What is database sharding?", "options": ["Deleting data", "Splitting a database across multiple machines", "Backing up data", "Indexing tables"], "correct_answer": 1, "explanation": "Sharding distributes data across multiple database instances to handle larger datasets and higher throughput."}]},
            {"title": "Caching & CDN Strategies", "video_url": "https://www.youtube.com/watch?v=U3RkDLtS7uY", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is caching?", "options": ["Storing money", "Storing frequently accessed data in fast storage for quick retrieval", "Compressing files", "Encrypting data"], "correct_answer": 1, "explanation": "Caching stores copies of frequently requested data closer to the consumer, reducing latency and database load."},
                      {"question": "What is a CDN?", "options": ["Central Database Network", "Content Delivery Network - distributes content via edge servers globally", "Cloud Data Node", "Custom Domain Name"], "correct_answer": 1, "explanation": "A CDN caches content at edge servers worldwide, serving users from the nearest location for faster load times."}]}
        ]
    },
    {
        "title": "CI/CD with GitHub Actions",
        "description": "Automate your development workflow with GitHub Actions. Learn to build CI/CD pipelines, run tests, deploy to cloud, manage secrets, and implement DevOps best practices directly in your GitHub repository.",
        "category": "DevOps", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Eddie Jaoude", "instructor_avatar": "https://randomuser.me/api/portraits/men/67.jpg",
        "instructor_title": "GitHub Star & DevOps Advocate",
        "thumbnail": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&q=80",
        "tags": ["CI/CD", "GitHub Actions", "DevOps", "Automation"],
        "what_you_learn": ["Create GitHub Actions workflows", "Build and test code automatically", "Deploy to AWS/Azure/GCP", "Manage secrets and environments"],
        "prerequisites": ["Git basics", "GitHub account"],
        "estimated_hours": 4, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "GitHub Actions Tutorial - Full Course", "video_url": "https://www.youtube.com/watch?v=R8_veQiYBjI", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [{"question": "What are GitHub Actions?", "options": ["GitHub's code editor", "CI/CD and automation platform built into GitHub", "A version control system", "A project management tool"], "correct_answer": 1, "explanation": "GitHub Actions automates workflows like CI/CD directly in your GitHub repository using YAML config files."},
                      {"question": "What triggers a workflow?", "options": ["Manual only", "Events like push, pull request, schedule, or manual dispatch", "Only on merge", "Only on release"], "correct_answer": 1, "explanation": "Workflows can be triggered by various events including pushes, PRs, schedules, manual dispatch, and more."},
                      {"question": "What is a workflow job?", "options": ["A task for humans", "A set of steps that run on the same runner", "A GitHub issue", "A code review"], "correct_answer": 1, "explanation": "A job is a set of steps executed on the same runner (virtual machine), and multiple jobs can run in parallel."}]},
            {"title": "Deploying with GitHub Actions", "video_url": "https://www.youtube.com/watch?v=X3F3El_yvFg", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [{"question": "Where are secrets stored in GitHub Actions?", "options": ["In the code", "In repository or organization encrypted settings", "In a text file", "In comments"], "correct_answer": 1, "explanation": "Secrets are stored encrypted in repository/org settings and accessed via ${{ secrets.NAME }} in workflows."},
                      {"question": "What is a GitHub Actions runner?", "options": ["A person who runs code", "A server that executes workflow jobs", "A code reviewer", "A branch type"], "correct_answer": 1, "explanation": "A runner is a virtual machine (GitHub-hosted or self-hosted) that executes the steps in a workflow job."}]}
        ]
    },
    {
        "title": "Advanced Cloud Architecture",
        "description": "Design enterprise-grade cloud architectures. Master multi-region deployments, disaster recovery, cost optimization, serverless patterns, event-driven architecture, and cloud-native security.",
        "category": "Cloud", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Adrian Cantrill", "instructor_avatar": "https://randomuser.me/api/portraits/men/60.jpg",
        "instructor_title": "AWS Community Hero & Cloud Architect",
        "thumbnail": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
        "tags": ["Cloud Architecture", "AWS", "Enterprise", "Premium"],
        "what_you_learn": ["Multi-region deployment strategies", "Disaster recovery planning", "Cost optimization techniques", "Event-driven and serverless patterns"],
        "prerequisites": ["Cloud fundamentals (AWS/Azure/GCP)", "Networking knowledge"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "Cloud Architecture Patterns", "video_url": "https://www.youtube.com/watch?v=REB_eGHK_P4", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is a multi-region architecture?", "options": ["Using multiple programming languages", "Deploying applications across multiple geographic regions for redundancy", "Multiple databases", "Multiple teams"], "correct_answer": 1, "explanation": "Multi-region deploys applications in multiple geographic regions for high availability and disaster recovery."},
                      {"question": "What is RTO in disaster recovery?", "options": ["Real-Time Operations", "Recovery Time Objective - max acceptable downtime", "Remote Transfer Object", "Runtime Timeout"], "correct_answer": 1, "explanation": "RTO (Recovery Time Objective) is the maximum acceptable time to restore operations after a disaster."},
                      {"question": "What is event-driven architecture?", "options": ["Calendar-based scheduling", "Systems that react to events/messages rather than direct calls", "Manual triggers only", "Database-driven design"], "correct_answer": 1, "explanation": "Event-driven architecture uses events to trigger and communicate between decoupled services, enabling scalability."}]},
            {"title": "Serverless & Cost Optimization", "video_url": "https://www.youtube.com/watch?v=Bz8m-FrMips", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is serverless computing?", "options": ["No servers exist", "Cloud provider manages servers; you only write code", "Running code locally", "Using containers"], "correct_answer": 1, "explanation": "Serverless means the cloud provider manages all infrastructure; you focus on code and pay only for execution time."},
                      {"question": "What is the biggest cost optimization strategy in cloud?", "options": ["Using the biggest instances", "Right-sizing resources and using reserved/spot instances", "Never scaling", "Using only free tier"], "correct_answer": 1, "explanation": "Right-sizing (matching resources to actual needs) combined with reserved/spot pricing provides the biggest savings."}]}
        ]
    },
    {
        "title": "Node.js & Express Backend Development",
        "description": "Build professional backend APIs with Node.js and Express. Cover routing, middleware, authentication, database integration, file uploads, error handling, and production deployment best practices.",
        "category": "Software Engineering", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Maximilian Schwarzmuller", "instructor_avatar": "https://randomuser.me/api/portraits/men/44.jpg",
        "instructor_title": "Full Stack Instructor",
        "thumbnail": "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80",
        "tags": ["Node.js", "Express", "Backend", "JavaScript", "API"],
        "what_you_learn": ["Build REST APIs with Express", "Implement authentication with JWT", "Connect to MongoDB/PostgreSQL", "Deploy Node.js to production"],
        "prerequisites": ["JavaScript fundamentals"],
        "estimated_hours": 8, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Node.js and Express.js - Full Course", "video_url": "https://www.youtube.com/watch?v=Oe421EPjeBE", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is Node.js?", "options": ["A browser", "A JavaScript runtime built on Chrome's V8 engine", "A database", "A CSS framework"], "correct_answer": 1, "explanation": "Node.js runs JavaScript outside the browser using Chrome's V8 engine, enabling server-side JavaScript."},
                      {"question": "What is Express?", "options": ["A Node.js package manager", "A minimal web framework for Node.js", "A database ORM", "A testing library"], "correct_answer": 1, "explanation": "Express is a fast, minimalist web framework for Node.js that simplifies building APIs and web applications."},
                      {"question": "What is middleware in Express?", "options": ["Hardware between servers", "Functions that execute during the request-response cycle", "A database layer", "A frontend component"], "correct_answer": 1, "explanation": "Middleware functions have access to request/response objects and can modify them, end the cycle, or call next()."}]},
            {"title": "MongoDB with Node.js - CRUD Operations", "video_url": "https://www.youtube.com/watch?v=fbYExfeFsI0", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is MongoDB?", "options": ["A SQL database", "A NoSQL document database", "A caching system", "A message queue"], "correct_answer": 1, "explanation": "MongoDB is a NoSQL document database that stores data in flexible, JSON-like documents instead of rows and tables."},
                      {"question": "What is Mongoose?", "options": ["An animal", "An ODM library for MongoDB and Node.js", "A web server", "A testing tool"], "correct_answer": 1, "explanation": "Mongoose is an Object Data Modeling library that provides schema validation and type casting for MongoDB in Node.js."}]}
        ]
    },
    {
        "title": "AI Agent Development with LangChain",
        "description": "Build autonomous AI agents using LangChain. Master chains, tools, memory, RAG pipelines, multi-agent systems, and deploy production-ready AI applications that can reason and take actions.",
        "category": "AI", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Sam Witteveen", "instructor_avatar": "https://randomuser.me/api/portraits/men/34.jpg",
        "instructor_title": "AI Engineer & Google Developer Expert",
        "thumbnail": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
        "tags": ["AI Agents", "LangChain", "RAG", "LLM", "Premium"],
        "what_you_learn": ["Build chains and agents with LangChain", "Implement RAG pipelines", "Create multi-agent systems", "Deploy AI agents to production"],
        "prerequisites": ["Python proficiency", "LLM/API experience"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "LangChain Full Course - Build AI Agents", "video_url": "https://www.youtube.com/watch?v=lG7Uxts9SXs", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is LangChain?", "options": ["A blockchain", "A framework for building applications powered by LLMs", "A chat application", "A database"], "correct_answer": 1, "explanation": "LangChain is a framework for developing applications powered by language models, providing tools for chains, agents, and memory."},
                      {"question": "What is a chain in LangChain?", "options": ["A metal chain", "A sequence of calls to LLMs, tools, or data sources", "A blockchain", "A linked list"], "correct_answer": 1, "explanation": "A chain combines multiple components (LLM calls, tools, parsers) into a sequence to accomplish complex tasks."},
                      {"question": "What is an AI agent?", "options": ["A chatbot only", "An AI system that can decide which tools to use and take actions", "A search engine", "A database query"], "correct_answer": 1, "explanation": "An AI agent uses an LLM to reason about which actions to take, selecting and using tools to accomplish goals."}]},
            {"title": "RAG Pipeline with LangChain", "video_url": "https://www.youtube.com/watch?v=tcqEUSNCn8I", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What does RAG combine?", "options": ["Two databases", "Information retrieval with language model generation", "Two programming languages", "Frontend and backend"], "correct_answer": 1, "explanation": "RAG retrieves relevant documents from a knowledge base and provides them as context to the LLM for generation."},
                      {"question": "What is a vector database used for in RAG?", "options": ["Storing images", "Storing document embeddings for semantic search", "Running SQL queries", "Hosting websites"], "correct_answer": 1, "explanation": "Vector databases store document embeddings and enable semantic similarity search to find relevant content for RAG."}]}
        ]
    },
    {
        "title": "MongoDB Complete Developer Guide",
        "description": "Master MongoDB from basics to advanced. Cover CRUD operations, aggregation pipeline, indexing, schema design, transactions, Atlas cloud, and performance optimization for production applications.",
        "category": "Software Engineering", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Academind", "instructor_avatar": "https://randomuser.me/api/portraits/men/62.jpg",
        "instructor_title": "Software Engineering Educator",
        "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80",
        "tags": ["MongoDB", "NoSQL", "Database", "Backend"],
        "what_you_learn": ["CRUD operations and queries", "Aggregation pipeline mastery", "Index optimization", "Schema design patterns"],
        "prerequisites": ["Basic programming knowledge"],
        "estimated_hours": 7, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "MongoDB Crash Course", "video_url": "https://www.youtube.com/watch?v=-56x56UppqQ", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [{"question": "What type of database is MongoDB?", "options": ["Relational (SQL)", "Document-oriented NoSQL", "Graph database", "Key-value store"], "correct_answer": 1, "explanation": "MongoDB is a document-oriented NoSQL database that stores data in flexible, JSON-like BSON documents."},
                      {"question": "What is a collection in MongoDB?", "options": ["A table", "A group of documents (equivalent to a table in SQL)", "A database", "An index"], "correct_answer": 1, "explanation": "A collection is a group of MongoDB documents, analogous to a table in relational databases."},
                      {"question": "What is the aggregation pipeline?", "options": ["A data pipeline tool", "A framework for transforming and analyzing data through stages", "A backup system", "An indexing method"], "correct_answer": 1, "explanation": "The aggregation pipeline processes documents through sequential stages like $match, $group, $sort for data analysis."}]},
            {"title": "MongoDB Indexing & Performance", "video_url": "https://www.youtube.com/watch?v=fUG8cpTg3cc", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [{"question": "Why use indexes in MongoDB?", "options": ["For security", "To speed up query performance by reducing documents scanned", "For backups", "For replication"], "correct_answer": 1, "explanation": "Indexes allow MongoDB to find documents efficiently without scanning every document in a collection."},
                      {"question": "What is a compound index?", "options": ["A chemical index", "An index on multiple fields for queries using those fields together", "A unique index", "A text index"], "correct_answer": 1, "explanation": "A compound index includes multiple fields, optimizing queries that filter or sort on those field combinations."}]}
        ]
    },
    {
        "title": "Prompt Engineering for Production",
        "description": "Advanced prompt engineering for building production AI systems. Master system prompts, output parsing, guardrails, evaluation frameworks, prompt chaining, and enterprise-grade prompt management.",
        "category": "Prompt Engineering", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Harrison Chase", "instructor_avatar": "https://randomuser.me/api/portraits/men/28.jpg",
        "instructor_title": "CEO of LangChain",
        "thumbnail": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&q=80",
        "tags": ["Prompt Engineering", "LLM", "Production AI", "Premium"],
        "what_you_learn": ["Design robust system prompts", "Output parsing and validation", "Prompt evaluation frameworks", "Enterprise prompt management"],
        "prerequisites": ["Basic prompt engineering", "API experience"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "Advanced Prompt Engineering Techniques", "video_url": "https://www.youtube.com/watch?v=T9aRN5JkmL8", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is a system prompt?", "options": ["An OS command", "Instructions that define the AI's behavior, role, and constraints", "A user message", "An error message"], "correct_answer": 1, "explanation": "System prompts set the AI's persona, rules, and boundaries — they're the foundation of production AI behavior."},
                      {"question": "What are guardrails in AI?", "options": ["Physical barriers", "Safety measures to prevent harmful, off-topic, or incorrect outputs", "Database constraints", "API rate limits"], "correct_answer": 1, "explanation": "Guardrails are safety mechanisms that constrain AI outputs to be safe, relevant, and aligned with intended use."},
                      {"question": "Why evaluate prompts systematically?", "options": ["It's not needed", "To measure quality, consistency, and catch regressions across prompt changes", "For compliance only", "To reduce costs only"], "correct_answer": 1, "explanation": "Systematic prompt evaluation ensures consistent quality, catches regressions, and enables data-driven improvement."}]},
            {"title": "Prompt Chaining & Complex Workflows", "video_url": "https://www.youtube.com/watch?v=dOxUroR57xs", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is prompt chaining?", "options": ["Linking websites", "Breaking complex tasks into sequential prompts where each builds on the previous", "Repeating the same prompt", "Using multiple AI models"], "correct_answer": 1, "explanation": "Prompt chaining decomposes complex tasks into a sequence of simpler prompts, improving reliability and quality."},
                      {"question": "What is output parsing?", "options": ["Reading files", "Extracting structured data from AI's free-text responses", "Compiling code", "Formatting HTML"], "correct_answer": 1, "explanation": "Output parsing converts unstructured AI text into structured formats (JSON, objects) for reliable downstream use."}]}
        ]
    },
    {
        "title": "Agile & Scrum Methodology",
        "description": "Master Agile principles and Scrum framework. Learn sprint planning, daily standups, retrospectives, user stories, backlog management, velocity tracking, and how to lead high-performing agile teams.",
        "category": "Product Management", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Mike Cohn", "instructor_avatar": "https://randomuser.me/api/portraits/men/73.jpg",
        "instructor_title": "Agile Coach & Author",
        "thumbnail": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
        "tags": ["Agile", "Scrum", "Project Management", "Sprint"],
        "what_you_learn": ["Agile principles and values", "Scrum roles, events, and artifacts", "Sprint planning and execution", "Continuous improvement practices"],
        "prerequisites": ["None"],
        "estimated_hours": 4, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Agile & Scrum Full Course", "video_url": "https://www.youtube.com/watch?v=uURTJC0r2Iw", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is Agile?", "options": ["A programming language", "An iterative approach to project management and software development", "A database", "A testing framework"], "correct_answer": 1, "explanation": "Agile is an iterative approach that delivers work in small increments, enabling flexibility and continuous improvement."},
                      {"question": "What are the Scrum roles?", "options": ["Manager, Developer, Tester", "Product Owner, Scrum Master, Development Team", "CEO, CTO, Developer", "Lead, Senior, Junior"], "correct_answer": 1, "explanation": "Scrum defines three roles: Product Owner (what to build), Scrum Master (process), and Development Team (how to build)."},
                      {"question": "What is a Sprint?", "options": ["A marathon", "A time-boxed iteration (usually 2-4 weeks) for delivering work", "A release", "A meeting"], "correct_answer": 1, "explanation": "A Sprint is a fixed time period (typically 2-4 weeks) during which the team completes a set of planned work items."}]},
            {"title": "User Stories & Backlog Management", "video_url": "https://www.youtube.com/watch?v=LGeDZmrWwsw", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is a user story?", "options": ["A novel about users", "A short description of a feature from the user's perspective", "A bug report", "A design document"], "correct_answer": 1, "explanation": "A user story describes functionality from the end user's perspective: 'As a [user], I want [feature] so that [benefit]'."},
                      {"question": "What is the product backlog?", "options": ["Unfinished work", "A prioritized list of all desired work for the product", "A bug list", "A sprint goal"], "correct_answer": 1, "explanation": "The product backlog is an ordered list of everything needed in the product, maintained by the Product Owner."}]}
        ]
    },
    {
        "title": "Computer Vision with OpenCV",
        "description": "Learn computer vision using OpenCV and Python. Cover image processing, object detection, face recognition, video analysis, image segmentation, and build real-world CV applications.",
        "category": "AI", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Patrick Loeber", "instructor_avatar": "https://randomuser.me/api/portraits/men/53.jpg",
        "instructor_title": "ML Engineer & Content Creator",
        "thumbnail": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80",
        "tags": ["Computer Vision", "OpenCV", "Python", "Image Processing"],
        "what_you_learn": ["Image processing fundamentals", "Object detection and tracking", "Face detection and recognition", "Video analysis techniques"],
        "prerequisites": ["Python basics", "NumPy knowledge helpful"],
        "estimated_hours": 7, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "OpenCV Course - Full Tutorial with Python", "video_url": "https://www.youtube.com/watch?v=oXlwWbU8l2o", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is OpenCV?", "options": ["A web framework", "An open-source computer vision and image processing library", "A database", "An operating system"], "correct_answer": 1, "explanation": "OpenCV (Open Source Computer Vision Library) provides tools for real-time image and video processing."},
                      {"question": "How are images represented in OpenCV?", "options": ["As strings", "As NumPy arrays of pixel values", "As JSON", "As XML"], "correct_answer": 1, "explanation": "OpenCV represents images as NumPy arrays where each element represents pixel values (BGR color channels)."},
                      {"question": "What is edge detection?", "options": ["Finding page borders", "Identifying boundaries between regions with different intensities", "Removing borders", "Adding borders"], "correct_answer": 1, "explanation": "Edge detection identifies sharp changes in pixel intensity, revealing object boundaries and structural features."}]},
            {"title": "Object Detection & Face Recognition", "video_url": "https://www.youtube.com/watch?v=WQeoO7MI0Bs", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is object detection?", "options": ["Finding files", "Locating and classifying objects within an image or video", "Debugging code", "Database queries"], "correct_answer": 1, "explanation": "Object detection identifies what objects are in an image and where they are, drawing bounding boxes around them."},
                      {"question": "What is a Haar Cascade?", "options": ["A waterfall", "A pre-trained classifier for detecting objects like faces", "A neural network", "A color filter"], "correct_answer": 1, "explanation": "Haar Cascade is a machine learning-based approach using cascaded classifiers, commonly used for face detection."}]}
        ]
    },
    {
        "title": "MLOps & Model Deployment",
        "description": "Bridge the gap between ML experiments and production. Learn model versioning, experiment tracking, CI/CD for ML, containerized deployments, monitoring, and managing ML systems at scale.",
        "category": "AI", "level": "advanced", "is_premium": True, "price": 29.00,
        "instructor_name": "Chip Huyen", "instructor_avatar": "https://randomuser.me/api/portraits/women/42.jpg",
        "instructor_title": "Author of Designing ML Systems",
        "thumbnail": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
        "tags": ["MLOps", "Model Deployment", "Production ML", "Premium"],
        "what_you_learn": ["ML model versioning and tracking", "CI/CD pipelines for ML", "Model serving and monitoring", "Feature stores and data pipelines"],
        "prerequisites": ["ML fundamentals", "Python", "Docker basics"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "MLOps Course - Production Machine Learning", "video_url": "https://www.youtube.com/watch?v=s8Jj4LGiNnU", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [{"question": "What is MLOps?", "options": ["A new ML algorithm", "Practices for deploying and maintaining ML models in production", "A Python library", "A cloud service"], "correct_answer": 1, "explanation": "MLOps combines ML, DevOps, and data engineering to reliably deploy and maintain ML models in production."},
                      {"question": "Why is model monitoring important?", "options": ["It's not important", "Models degrade over time due to data drift and need monitoring", "Only for compliance", "For billing only"], "correct_answer": 1, "explanation": "Production models can degrade as real-world data changes (data drift), requiring continuous monitoring and retraining."},
                      {"question": "What is experiment tracking?", "options": ["Tracking lab experiments", "Recording ML experiment parameters, metrics, and artifacts for reproducibility", "Bug tracking", "Time tracking"], "correct_answer": 1, "explanation": "Experiment tracking logs hyperparameters, metrics, code versions, and artifacts to reproduce and compare ML experiments."}]},
            {"title": "Model Serving with Docker & Kubernetes", "video_url": "https://www.youtube.com/watch?v=AWAPsxKxlBY", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [{"question": "What is model serving?", "options": ["Training a model", "Making a trained model available for predictions via an API", "Saving a model", "Evaluating a model"], "correct_answer": 1, "explanation": "Model serving deploys a trained model behind an API endpoint so applications can request predictions in real-time."},
                      {"question": "What is data drift?", "options": ["Data moving slowly", "When production data distribution changes from training data", "Data corruption", "Data backup"], "correct_answer": 1, "explanation": "Data drift occurs when the statistical properties of production data differ from training data, degrading model performance."}]}
        ]
    }
]

def seed():
    for course in COURSES:
        r = requests.post(f"{API_URL}/api/academy/admin/courses", headers=HEADERS, json=course)
        if r.status_code == 200:
            d = r.json()
            ls = course.get("lessons", [])
            p = "PRO" if course["is_premium"] else "FREE"
            print(f"  [{p:4}] {d.get('course',{}).get('title','?')[:42]:42} | {len(ls)} lessons | {sum(len(l.get('quiz',[])) for l in ls)} Qs")
        else:
            print(f"  FAIL: {course['title'][:40]} - {r.status_code}")

if __name__ == "__main__":
    print(f"Seeding {len(COURSES)} courses...")
    seed()
    print("Done!")
