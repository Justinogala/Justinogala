#!/usr/bin/env python3
"""Seed 12 additional professional free courses with real YouTube lessons and quiz questions."""
import json, sys, requests

API_URL = sys.argv[1] if len(sys.argv) > 1 else "https://new-user-welcome-2.preview.emergentagent.com"
TOKEN = sys.argv[2] if len(sys.argv) > 2 else ""
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

COURSES = [
    {
        "title": "Kubernetes for Beginners",
        "description": "Learn container orchestration with Kubernetes. Understand pods, deployments, services, ingress, ConfigMaps, secrets, and how to manage containerized applications at scale in production environments.",
        "category": "DevOps", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "TechWorld with Nana", "instructor_avatar": "https://randomuser.me/api/portraits/women/33.jpg",
        "instructor_title": "DevOps Engineer & Educator",
        "thumbnail": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80",
        "tags": ["Kubernetes", "K8s", "DevOps", "Containers", "Orchestration"],
        "what_you_learn": ["Kubernetes architecture and components", "Deploy and manage pods and services", "Use ConfigMaps, Secrets, and Volumes", "Scale applications with Deployments"],
        "prerequisites": ["Docker basics", "Command line familiarity"],
        "estimated_hours": 7, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Kubernetes Tutorial for Beginners - Full Course", "video_url": "https://www.youtube.com/watch?v=X48VuDVv0do", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is Kubernetes?", "options": ["A programming language", "An open-source container orchestration platform", "A cloud provider", "A database system"], "correct_answer": 1, "explanation": "Kubernetes (K8s) is an open-source platform that automates deploying, scaling, and managing containerized applications."},
                {"question": "What is a Pod in Kubernetes?", "options": ["A virtual machine", "The smallest deployable unit containing one or more containers", "A network switch", "A storage volume"], "correct_answer": 1, "explanation": "A Pod is the smallest unit in Kubernetes, wrapping one or more containers that share networking and storage."},
                {"question": "What does kubectl do?", "options": ["Builds containers", "Command-line tool to interact with Kubernetes clusters", "Monitors servers", "Compiles code"], "correct_answer": 1, "explanation": "kubectl is the CLI tool used to run commands against Kubernetes clusters for deploying and managing resources."}
            ]},
            {"title": "Kubernetes Deployments & Services", "video_url": "https://www.youtube.com/watch?v=EQNO_kM96Mo", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is a Kubernetes Deployment?", "options": ["A one-time task", "A controller that manages ReplicaSets and Pod updates", "A monitoring tool", "A storage class"], "correct_answer": 1, "explanation": "A Deployment manages ReplicaSets and provides declarative updates for Pods, handling rollouts and rollbacks."},
                {"question": "What does a Kubernetes Service do?", "options": ["Runs a container", "Exposes Pods to network traffic with a stable endpoint", "Stores configuration", "Manages secrets"], "correct_answer": 1, "explanation": "A Service provides a stable network endpoint to access a set of Pods, enabling load balancing and discovery."},
                {"question": "What is a namespace?", "options": ["A variable name", "A way to divide cluster resources between teams", "A DNS record", "A container image tag"], "correct_answer": 1, "explanation": "Namespaces divide a single cluster into virtual sub-clusters, providing isolation between teams or environments."}
            ]},
            {"title": "Kubernetes Volumes & ConfigMaps", "video_url": "https://www.youtube.com/watch?v=OulmwTYTEuI", "duration": "20 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "Why do Kubernetes Pods need Volumes?", "options": ["For CPU power", "Containers lose data when they restart; Volumes persist data", "For networking", "To run multiple containers"], "correct_answer": 1, "explanation": "Container filesystems are ephemeral. Volumes provide persistent storage that survives container restarts."},
                {"question": "What is a ConfigMap?", "options": ["A map visualization", "An object to store non-confidential configuration data", "A network map", "A deployment strategy"], "correct_answer": 1, "explanation": "ConfigMaps store non-sensitive configuration data as key-value pairs, decoupling config from container images."},
                {"question": "What should you use to store passwords in Kubernetes?", "options": ["ConfigMap", "Secret", "Volume", "Label"], "correct_answer": 1, "explanation": "Secrets are designed to store sensitive data like passwords, tokens, and keys with base64 encoding."}
            ]}
        ]
    },
    {
        "title": "Git & GitHub Complete Guide",
        "description": "Master version control with Git and collaboration with GitHub. Learn branching, merging, pull requests, conflict resolution, and professional Git workflows used by development teams worldwide.",
        "category": "Software Engineering", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Colt Steele", "instructor_avatar": "https://randomuser.me/api/portraits/men/29.jpg",
        "instructor_title": "Developer & Bootcamp Instructor",
        "thumbnail": "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&q=80",
        "tags": ["Git", "GitHub", "Version Control", "Collaboration"],
        "what_you_learn": ["Git fundamentals: add, commit, push, pull", "Branching and merging strategies", "Pull requests and code reviews", "Resolve merge conflicts confidently"],
        "prerequisites": ["Basic command line knowledge"],
        "estimated_hours": 5, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Git and GitHub for Beginners - Full Course", "video_url": "https://www.youtube.com/watch?v=RGOj5yH7evk", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is Git?", "options": ["A programming language", "A distributed version control system", "A text editor", "A cloud platform"], "correct_answer": 1, "explanation": "Git is a distributed version control system that tracks changes in source code during software development."},
                {"question": "What does 'git commit' do?", "options": ["Uploads code to GitHub", "Saves a snapshot of staged changes to local repo", "Downloads code", "Deletes files"], "correct_answer": 1, "explanation": "git commit records a snapshot of the staged changes in the local repository with a descriptive message."},
                {"question": "What is a branch in Git?", "options": ["A folder", "An independent line of development", "A backup copy", "A remote server"], "correct_answer": 1, "explanation": "A branch is a parallel line of development that lets you work on features without affecting the main codebase."}
            ]},
            {"title": "Git Branching and Merging", "video_url": "https://www.youtube.com/watch?v=Q1kHG842HoI", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does 'git merge' do?", "options": ["Deletes a branch", "Combines changes from one branch into another", "Creates a new branch", "Reverts changes"], "correct_answer": 1, "explanation": "git merge integrates changes from one branch into the current branch, combining their histories."},
                {"question": "What is a merge conflict?", "options": ["A bug in Git", "When the same lines are changed differently in both branches", "A network error", "A permission issue"], "correct_answer": 1, "explanation": "Merge conflicts occur when Git can't automatically resolve differences between two branches' changes to the same lines."},
                {"question": "What is a pull request?", "options": ["Downloading code", "A request to merge your branch into another, enabling code review", "Pulling from a database", "A Git command"], "correct_answer": 1, "explanation": "A pull request proposes merging your changes, allowing team members to review code before it's integrated."}
            ]}
        ]
    },
    {
        "title": "SQL for Data Analysis",
        "description": "Learn SQL from scratch for data analysis. Cover SELECT queries, JOINs, aggregations, subqueries, window functions, and CTEs. Practice with real-world datasets to extract meaningful business insights.",
        "category": "Data Science", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Alex Freberg", "instructor_avatar": "https://randomuser.me/api/portraits/men/22.jpg",
        "instructor_title": "Data Analyst & Content Creator",
        "thumbnail": "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80",
        "tags": ["SQL", "Database", "Data Analysis", "Queries"],
        "what_you_learn": ["Write SQL queries from basic to advanced", "JOIN multiple tables effectively", "Use aggregate functions and GROUP BY", "Window functions and CTEs"],
        "prerequisites": ["No prior SQL experience needed"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "SQL Tutorial - Full Database Course", "video_url": "https://www.youtube.com/watch?v=HXV3zeQKqGY", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What does SQL stand for?", "options": ["Simple Query Language", "Structured Query Language", "Standard Question Logic", "System Query Lookup"], "correct_answer": 1, "explanation": "SQL stands for Structured Query Language, used to communicate with and manage relational databases."},
                {"question": "Which SQL command retrieves data?", "options": ["INSERT", "UPDATE", "SELECT", "DELETE"], "correct_answer": 2, "explanation": "SELECT is used to query and retrieve data from one or more database tables."},
                {"question": "What does WHERE do in SQL?", "options": ["Creates a table", "Filters rows based on conditions", "Sorts results", "Groups data"], "correct_answer": 1, "explanation": "The WHERE clause filters rows that meet specified conditions, reducing the result set."}
            ]},
            {"title": "SQL JOINs Explained", "video_url": "https://www.youtube.com/watch?v=9yeOJ0ZMUYw", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does INNER JOIN return?", "options": ["All rows from both tables", "Only rows with matching values in both tables", "All rows from the left table", "All rows from the right table"], "correct_answer": 1, "explanation": "INNER JOIN returns only rows where there is a match in both tables based on the join condition."},
                {"question": "What is a LEFT JOIN?", "options": ["Joins tables to the left", "Returns all rows from the left table plus matching rows from the right", "Returns only unmatched rows", "Same as INNER JOIN"], "correct_answer": 1, "explanation": "LEFT JOIN returns all rows from the left table and matched rows from the right; unmatched right rows show NULL."},
                {"question": "What is a PRIMARY KEY?", "options": ["The first column", "A unique identifier for each row in a table", "A password", "A table name"], "correct_answer": 1, "explanation": "A primary key uniquely identifies each record in a table, ensuring no duplicates and no NULL values."}
            ]},
            {"title": "Advanced SQL - Window Functions & CTEs", "video_url": "https://www.youtube.com/watch?v=MAs1zo2MAps", "duration": "30 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is a window function?", "options": ["Opens a new window", "Performs calculations across related rows without collapsing them", "A GUI tool", "A function for dates"], "correct_answer": 1, "explanation": "Window functions compute values across a set of related rows while keeping individual row detail intact."},
                {"question": "What does ROW_NUMBER() do?", "options": ["Counts total rows", "Assigns a unique sequential number to each row in a partition", "Numbers tables", "Creates an index"], "correct_answer": 1, "explanation": "ROW_NUMBER() assigns a unique sequential integer to rows within a partition based on the specified ordering."},
                {"question": "What is a CTE?", "options": ["A database engine", "Common Table Expression - a temporary named result set", "A data type", "A column constraint"], "correct_answer": 1, "explanation": "A CTE (Common Table Expression) is a temporary result set defined within a query, improving readability."}
            ]}
        ]
    },
    {
        "title": "Terraform & Infrastructure as Code",
        "description": "Learn Infrastructure as Code with Terraform. Provision and manage cloud resources on AWS, Azure, and GCP declaratively. Cover HCL syntax, modules, state management, and production best practices.",
        "category": "DevOps", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Sid Palas", "instructor_avatar": "https://randomuser.me/api/portraits/men/41.jpg",
        "instructor_title": "Cloud Infrastructure Engineer",
        "thumbnail": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
        "tags": ["Terraform", "IaC", "Cloud", "AWS", "Infrastructure"],
        "what_you_learn": ["Write Terraform configurations in HCL", "Provision AWS/Azure/GCP resources", "Manage Terraform state safely", "Create reusable modules"],
        "prerequisites": ["Basic cloud knowledge", "Command line familiarity"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Terraform Course - Automate Your AWS Infrastructure", "video_url": "https://www.youtube.com/watch?v=SLB_c_ayRMo", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is Infrastructure as Code?", "options": ["Writing code inside servers", "Managing infrastructure through machine-readable config files", "A type of programming language", "Manual server setup"], "correct_answer": 1, "explanation": "IaC manages and provisions infrastructure through code rather than manual processes, enabling automation and version control."},
                {"question": "What language does Terraform use?", "options": ["Python", "YAML", "HCL (HashiCorp Configuration Language)", "JavaScript"], "correct_answer": 2, "explanation": "Terraform uses HCL, a declarative language designed for defining infrastructure resources."},
                {"question": "What does 'terraform apply' do?", "options": ["Validates config", "Creates or updates infrastructure to match configuration", "Destroys resources", "Shows current state"], "correct_answer": 1, "explanation": "terraform apply executes the planned changes, creating, updating, or deleting resources to match the config."}
            ]},
            {"title": "Terraform State & Modules", "video_url": "https://www.youtube.com/watch?v=l5k1ai_GBDE", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is Terraform state?", "options": ["A US state", "A file tracking the real-world resources Terraform manages", "A variable type", "An error state"], "correct_answer": 1, "explanation": "Terraform state maps your config to real-world resources, tracking what has been created and their current status."},
                {"question": "Why use remote state?", "options": ["It's faster", "Enables team collaboration and prevents conflicts", "It's required", "For backups only"], "correct_answer": 1, "explanation": "Remote state storage enables team collaboration, state locking to prevent conflicts, and secure access control."},
                {"question": "What is a Terraform module?", "options": ["A Python import", "A reusable, self-contained package of Terraform configs", "A cloud service", "An API endpoint"], "correct_answer": 1, "explanation": "Modules are reusable Terraform configurations that encapsulate resources, promoting code reuse and organization."}
            ]}
        ]
    },
    {
        "title": "Product Management Fundamentals",
        "description": "Learn the core skills of product management. Cover user research, product strategy, roadmapping, prioritization frameworks, agile methodology, metrics, and how to work effectively with engineering and design teams.",
        "category": "Product Management", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Lenny Rachitsky", "instructor_avatar": "https://randomuser.me/api/portraits/men/64.jpg",
        "instructor_title": "Product Advisor & Newsletter Author",
        "thumbnail": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
        "tags": ["Product Management", "Agile", "Strategy", "Roadmap", "User Research"],
        "what_you_learn": ["Define product vision and strategy", "Prioritize features with frameworks", "Run effective user research", "Build and communicate roadmaps"],
        "prerequisites": ["None - suitable for aspiring PMs"],
        "estimated_hours": 5, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Product Management Full Course", "video_url": "https://www.youtube.com/watch?v=ueT-bMOqkD4", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What does a Product Manager do?", "options": ["Writes all the code", "Defines what to build, why, and for whom", "Designs the UI only", "Manages the servers"], "correct_answer": 1, "explanation": "A PM defines the product vision, strategy, and roadmap — deciding what to build based on user needs and business goals."},
                {"question": "What is a user persona?", "options": ["A real user", "A fictional representation of your target user", "A login system", "A UI component"], "correct_answer": 1, "explanation": "A user persona is a semi-fictional representation of your ideal customer based on research and data."},
                {"question": "What is an MVP?", "options": ["Most Valuable Player", "Minimum Viable Product - simplest version with core value", "Maximum Value Product", "Main Version Product"], "correct_answer": 1, "explanation": "An MVP is the simplest version of a product that delivers core value, used to validate assumptions quickly."}
            ]},
            {"title": "Prioritization Frameworks for PMs", "video_url": "https://www.youtube.com/watch?v=bBTZ_FwXft0", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is the RICE framework?", "options": ["A cooking method", "Reach, Impact, Confidence, Effort - a prioritization model", "A database query", "A design pattern"], "correct_answer": 1, "explanation": "RICE scores features by Reach, Impact, Confidence, and Effort to objectively prioritize what to build next."},
                {"question": "What is a product roadmap?", "options": ["A GPS map", "A strategic document showing planned features over time", "A code repository", "A testing plan"], "correct_answer": 1, "explanation": "A product roadmap communicates the vision, direction, and planned features of a product over time."},
                {"question": "What is the MoSCoW method?", "options": ["A Russian technique", "Must have, Should have, Could have, Won't have - prioritization", "A testing framework", "A deployment strategy"], "correct_answer": 1, "explanation": "MoSCoW categorizes requirements into Must have, Should have, Could have, and Won't have for clear prioritization."}
            ]}
        ]
    },
    {
        "title": "TypeScript Complete Course",
        "description": "Learn TypeScript from scratch. Understand types, interfaces, generics, enums, utility types, and how TypeScript improves JavaScript development. Essential for modern React, Node.js, and enterprise applications.",
        "category": "Software Engineering", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Matt Pocock", "instructor_avatar": "https://randomuser.me/api/portraits/men/72.jpg",
        "instructor_title": "TypeScript Educator & OSS Contributor",
        "thumbnail": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=600&q=80",
        "tags": ["TypeScript", "JavaScript", "Types", "Frontend", "Backend"],
        "what_you_learn": ["Type annotations and type inference", "Interfaces, generics, and utility types", "TypeScript with React and Node.js", "Migrate JavaScript to TypeScript"],
        "prerequisites": ["JavaScript fundamentals"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "TypeScript Full Course for Beginners", "video_url": "https://www.youtube.com/watch?v=30LWjhZzg50", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is TypeScript?", "options": ["A new language replacing JavaScript", "A typed superset of JavaScript that compiles to JS", "A CSS framework", "A testing tool"], "correct_answer": 1, "explanation": "TypeScript adds static types to JavaScript and compiles down to plain JavaScript for runtime execution."},
                {"question": "What does 'string' type enforce?", "options": ["Numbers only", "Only text/string values can be assigned", "Boolean values", "Any value"], "correct_answer": 1, "explanation": "The string type ensures only text values are assigned, catching type errors during development."},
                {"question": "What is an interface in TypeScript?", "options": ["A GUI element", "A contract defining the shape of an object", "A function type", "A CSS class"], "correct_answer": 1, "explanation": "An interface defines the structure an object must follow, specifying property names and their types."}
            ]},
            {"title": "TypeScript Generics Explained", "video_url": "https://www.youtube.com/watch?v=nViEqpgwxHE", "duration": "22 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What are generics in TypeScript?", "options": ["Generic code", "Type parameters that create reusable, flexible components", "Default types", "Any type alias"], "correct_answer": 1, "explanation": "Generics allow creating components that work with multiple types while maintaining type safety."},
                {"question": "What does T represent in Array<T>?", "options": ["The letter T", "A placeholder for any type the caller specifies", "A time type", "A template literal"], "correct_answer": 1, "explanation": "T is a type variable — a placeholder that gets replaced with the actual type when the generic is used."},
                {"question": "What is a union type?", "options": ["A single type", "A type that can be one of several types (e.g., string | number)", "A merged type", "A class type"], "correct_answer": 1, "explanation": "Union types use | to indicate a value can be one of several types, like string | number."}
            ]}
        ]
    },
    {
        "title": "Natural Language Processing with Python",
        "description": "Dive into NLP with Python using NLTK, spaCy, and transformers. Learn text preprocessing, sentiment analysis, named entity recognition, text classification, and build real NLP applications.",
        "category": "AI", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Dr. Rachel Thomas", "instructor_avatar": "https://randomuser.me/api/portraits/women/48.jpg",
        "instructor_title": "Co-founder fast.ai & AI Researcher",
        "thumbnail": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
        "tags": ["NLP", "AI", "Python", "Text Analysis", "Transformers"],
        "what_you_learn": ["Text preprocessing and tokenization", "Sentiment analysis techniques", "Named Entity Recognition", "Use Hugging Face transformers"],
        "prerequisites": ["Python programming", "Basic ML knowledge"],
        "estimated_hours": 8, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "NLP with Python - Full Course", "video_url": "https://www.youtube.com/watch?v=fOvTtapxa9c", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is NLP?", "options": ["Network Layer Protocol", "Natural Language Processing - AI understanding human language", "New Learning Program", "Neural Logic Programming"], "correct_answer": 1, "explanation": "NLP is a branch of AI focused on enabling computers to understand, interpret, and generate human language."},
                {"question": "What is tokenization?", "options": ["Creating tokens", "Breaking text into smaller units (words or subwords)", "Encrypting text", "Compressing text"], "correct_answer": 1, "explanation": "Tokenization splits text into individual tokens (words, subwords, or characters) for processing by NLP models."},
                {"question": "What is sentiment analysis?", "options": ["Analyzing code", "Determining the emotional tone of text (positive/negative/neutral)", "Checking grammar", "Translating languages"], "correct_answer": 1, "explanation": "Sentiment analysis classifies text by emotional tone — identifying whether opinions are positive, negative, or neutral."}
            ]},
            {"title": "Named Entity Recognition & Text Classification", "video_url": "https://www.youtube.com/watch?v=muCYQ1AknJQ", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is Named Entity Recognition (NER)?", "options": ["Naming variables", "Identifying and classifying entities (people, places, orgs) in text", "Renaming files", "Entity-relationship diagrams"], "correct_answer": 1, "explanation": "NER locates and classifies named entities in text into categories like person, organization, location, and date."},
                {"question": "What is text classification?", "options": ["Sorting files", "Assigning predefined categories to text documents", "Formatting text", "Compiling code"], "correct_answer": 1, "explanation": "Text classification assigns one or more categories to a text document, like spam detection or topic labeling."},
                {"question": "What is a stop word?", "options": ["A banned word", "A common word (the, is, at) often removed in NLP preprocessing", "An error word", "A keyword"], "correct_answer": 1, "explanation": "Stop words are frequently occurring words like 'the', 'is', 'at' that are often filtered out as they add little meaning."}
            ]}
        ]
    },
    {
        "title": "Linux Command Line Mastery",
        "description": "Master the Linux command line from beginner to power user. Learn file management, permissions, shell scripting, process management, networking commands, and system administration essentials.",
        "category": "Software Engineering", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "LearnLinuxTV", "instructor_avatar": "https://randomuser.me/api/portraits/men/58.jpg",
        "instructor_title": "Linux Systems Administrator",
        "thumbnail": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&q=80",
        "tags": ["Linux", "Command Line", "Bash", "Shell", "SysAdmin"],
        "what_you_learn": ["Navigate the filesystem confidently", "File permissions and ownership", "Write basic shell scripts", "Process management and networking"],
        "prerequisites": ["Access to a Linux terminal (or WSL/Mac)"],
        "estimated_hours": 5, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Linux for Beginners - Full Course", "video_url": "https://www.youtube.com/watch?v=sWbUDq4S6Y8", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What command lists files in a directory?", "options": ["dir", "ls", "list", "show"], "correct_answer": 1, "explanation": "The 'ls' command lists directory contents. Use 'ls -la' for detailed listing including hidden files."},
                {"question": "What does 'cd' stand for?", "options": ["Copy directory", "Change directory", "Create directory", "Check directory"], "correct_answer": 1, "explanation": "cd (change directory) navigates between directories in the filesystem."},
                {"question": "What does 'chmod 755 file.sh' do?", "options": ["Deletes the file", "Sets read/write/execute for owner, read/execute for others", "Renames the file", "Copies the file"], "correct_answer": 1, "explanation": "chmod 755 gives the owner full permissions (rwx) and read+execute (rx) to group and others."}
            ]},
            {"title": "Bash Shell Scripting Tutorial", "video_url": "https://www.youtube.com/watch?v=tK9Oc6AEnR4", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is a shell script?", "options": ["A compiled program", "A text file containing a sequence of commands", "A GUI application", "A kernel module"], "correct_answer": 1, "explanation": "A shell script is a text file with commands that the shell executes sequentially, automating tasks."},
                {"question": "What does the shebang #!/bin/bash do?", "options": ["Comments the line", "Specifies which interpreter should execute the script", "Imports a library", "Defines a variable"], "correct_answer": 1, "explanation": "The shebang line tells the system which interpreter (bash, python, etc.) to use when running the script."},
                {"question": "How do you make a script executable?", "options": ["rename to .exe", "chmod +x script.sh", "run script.sh", "compile script.sh"], "correct_answer": 1, "explanation": "chmod +x adds execute permission to a file, allowing it to be run as a program."}
            ]}
        ]
    },
    {
        "title": "API Design & RESTful Services",
        "description": "Learn to design and build professional REST APIs. Cover HTTP methods, status codes, authentication, versioning, pagination, error handling, documentation, and API security best practices.",
        "category": "Software Engineering", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Caleb Curry", "instructor_avatar": "https://randomuser.me/api/portraits/men/31.jpg",
        "instructor_title": "Software Developer & Tech Educator",
        "thumbnail": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&q=80",
        "tags": ["API", "REST", "Backend", "Web Services", "HTTP"],
        "what_you_learn": ["Design RESTful API endpoints", "HTTP methods and status codes", "Authentication with JWT and OAuth", "API documentation and versioning"],
        "prerequisites": ["Basic web development knowledge"],
        "estimated_hours": 5, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "REST API Tutorial - Full Course", "video_url": "https://www.youtube.com/watch?v=-MTSQjw5DrM", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What does REST stand for?", "options": ["Real-time Execution Service Technology", "Representational State Transfer", "Remote Server Testing", "Request-response Exchange Standard"], "correct_answer": 1, "explanation": "REST (Representational State Transfer) is an architectural style for designing networked applications."},
                {"question": "Which HTTP method creates a new resource?", "options": ["GET", "POST", "PUT", "DELETE"], "correct_answer": 1, "explanation": "POST is used to create new resources on the server, sending data in the request body."},
                {"question": "What does a 404 status code mean?", "options": ["Success", "Server error", "Resource not found", "Unauthorized"], "correct_answer": 2, "explanation": "HTTP 404 means the requested resource was not found on the server."}
            ]},
            {"title": "API Authentication - JWT Explained", "video_url": "https://www.youtube.com/watch?v=7Q17ubqLfaM", "duration": "22 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is JWT?", "options": ["JavaScript Web Toolkit", "JSON Web Token - a compact token for authentication", "Java Web Technology", "JSON Worker Thread"], "correct_answer": 1, "explanation": "JWT (JSON Web Token) is a compact, URL-safe token format used for securely transmitting authentication claims."},
                {"question": "What are the three parts of a JWT?", "options": ["User, Pass, Token", "Header, Payload, Signature", "Key, Value, Pair", "Auth, Data, Hash"], "correct_answer": 1, "explanation": "A JWT consists of a Header (algorithm), Payload (claims/data), and Signature (verification) separated by dots."},
                {"question": "What is the difference between authentication and authorization?", "options": ["No difference", "Authentication verifies identity; authorization checks permissions", "Authorization comes first", "They are the same process"], "correct_answer": 1, "explanation": "Authentication verifies WHO you are; authorization determines WHAT you're allowed to do."}
            ]}
        ]
    },
    {
        "title": "Azure Cloud Fundamentals",
        "description": "Get started with Microsoft Azure cloud services. Learn about virtual machines, Azure App Service, Azure Functions, storage, networking, Active Directory, and prepare for the AZ-900 certification.",
        "category": "Cloud", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Adam Marczak", "instructor_avatar": "https://randomuser.me/api/portraits/men/45.jpg",
        "instructor_title": "Azure Solutions Architect",
        "thumbnail": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80",
        "tags": ["Azure", "Cloud", "Microsoft", "AZ-900", "Certification"],
        "what_you_learn": ["Core Azure services and architecture", "Virtual machines and App Service", "Azure storage and networking", "Identity and access management"],
        "prerequisites": ["Basic IT knowledge"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Azure Fundamentals - Full Course (AZ-900)", "video_url": "https://www.youtube.com/watch?v=NKEFWyqJ5XA", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is Microsoft Azure?", "options": ["An operating system", "A cloud computing platform by Microsoft", "A programming language", "A database"], "correct_answer": 1, "explanation": "Azure is Microsoft's cloud computing platform offering 200+ services for building, deploying, and managing applications."},
                {"question": "What is an Azure region?", "options": ["A sales territory", "A geographical area containing one or more data centers", "A pricing tier", "A network zone"], "correct_answer": 1, "explanation": "An Azure region is a set of data centers deployed within a specific geographic area, connected by low-latency network."},
                {"question": "What is Azure Active Directory?", "options": ["A file system", "Cloud-based identity and access management service", "A database service", "A virtual machine"], "correct_answer": 1, "explanation": "Azure AD is Microsoft's cloud-based IAM service for managing users, groups, and application access."}
            ]},
            {"title": "Azure Services Overview", "video_url": "https://www.youtube.com/watch?v=6TKKbO2Fzag", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is Azure App Service?", "options": ["An app store", "A PaaS for hosting web apps without managing infrastructure", "A mobile SDK", "A monitoring tool"], "correct_answer": 1, "explanation": "Azure App Service is a fully managed PaaS for building and hosting web apps, APIs, and mobile backends."},
                {"question": "What are Azure Functions?", "options": ["Math functions", "Serverless compute that runs code on-demand without servers", "Database procedures", "UI components"], "correct_answer": 1, "explanation": "Azure Functions is a serverless compute service that lets you run event-triggered code without provisioning infrastructure."},
                {"question": "What is Azure Blob Storage?", "options": ["A database", "Object storage for unstructured data like images and documents", "A compute service", "A networking tool"], "correct_answer": 1, "explanation": "Azure Blob Storage stores massive amounts of unstructured data (text, binary, images, videos) as objects."}
            ]}
        ]
    },
    {
        "title": "Ethical Hacking & Penetration Testing",
        "description": "Learn ethical hacking methodologies and penetration testing techniques. Cover reconnaissance, scanning, exploitation, web app testing, wireless security, and reporting — all within legal and ethical boundaries.",
        "category": "Cybersecurity", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Heath Adams", "instructor_avatar": "https://randomuser.me/api/portraits/men/38.jpg",
        "instructor_title": "CEO TCM Security & Ethical Hacker",
        "thumbnail": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
        "tags": ["Ethical Hacking", "Penetration Testing", "Security", "Kali Linux"],
        "what_you_learn": ["Ethical hacking methodology", "Network scanning and enumeration", "Web application vulnerability testing", "Write professional pentest reports"],
        "prerequisites": ["Networking basics", "Linux command line"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Ethical Hacking Full Course - Beginner to Advanced", "video_url": "https://www.youtube.com/watch?v=3Kq1MIfTWCE", "duration": "50 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is ethical hacking?", "options": ["Illegal hacking", "Authorized testing of systems to find vulnerabilities", "Using antivirus software", "Building firewalls"], "correct_answer": 1, "explanation": "Ethical hacking is authorized security testing where professionals attempt to find vulnerabilities before malicious hackers do."},
                {"question": "What is the first phase of penetration testing?", "options": ["Exploitation", "Reconnaissance - gathering information about the target", "Reporting", "Cleanup"], "correct_answer": 1, "explanation": "Reconnaissance (information gathering) is always the first phase, collecting data about the target before any testing."},
                {"question": "What is Kali Linux?", "options": ["A gaming OS", "A Linux distribution designed for penetration testing", "A web server", "A firewall"], "correct_answer": 1, "explanation": "Kali Linux is a Debian-based distribution packed with hundreds of security testing and hacking tools."}
            ]},
            {"title": "Web Application Penetration Testing", "video_url": "https://www.youtube.com/watch?v=X4eRbHgRawI", "duration": "35 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is SQL injection?", "options": ["Adding SQL to a database", "Inserting malicious SQL through input fields to manipulate databases", "A database optimization", "A query language"], "correct_answer": 1, "explanation": "SQL injection exploits input fields to inject malicious SQL queries, potentially accessing or modifying database data."},
                {"question": "What is XSS?", "options": ["Extra Style Sheets", "Cross-Site Scripting - injecting scripts into web pages", "XML Schema Standard", "Extended Security System"], "correct_answer": 1, "explanation": "XSS (Cross-Site Scripting) injects malicious scripts into websites, executing them in other users' browsers."},
                {"question": "What is OWASP Top 10?", "options": ["Top 10 websites", "A list of the most critical web application security risks", "Top 10 programming languages", "A software ranking"], "correct_answer": 1, "explanation": "The OWASP Top 10 is a standard awareness document listing the most critical web application security vulnerabilities."}
            ]}
        ]
    }
]

def seed():
    for course in COURSES:
        r = requests.post(f"{API_URL}/api/academy/admin/courses", headers=HEADERS, json=course)
        if r.status_code == 200:
            d = r.json()
            lessons = course.get("lessons", [])
            quizzes = sum(1 for l in lessons if l.get("quiz"))
            qs = sum(len(l.get("quiz", [])) for l in lessons)
            print(f"  {d.get('course',{}).get('title','?')[:45]:45} | {len(lessons)} lessons | {quizzes} quizzes | {qs} questions")
        else:
            print(f"  FAILED: {course['title'][:40]} - {r.status_code}")

if __name__ == "__main__":
    print(f"Seeding {len(COURSES)} courses...")
    seed()
    print("Done!")
