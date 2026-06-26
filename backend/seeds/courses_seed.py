#!/usr/bin/env python3
"""Seed 8 professional free courses with real YouTube lessons and quiz questions."""
import json, sys, os, requests

API_URL = sys.argv[1] if len(sys.argv) > 1 else "https://new-user-welcome-2.preview.emergentagent.com"
TOKEN = sys.argv[2] if len(sys.argv) > 2 else ""

HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

COURSES = [
    {
        "title": "Python Programming for Beginners",
        "description": "A complete beginner's guide to Python programming. Learn variables, data types, control flow, functions, file handling, and object-oriented programming through hands-on examples. Perfect for anyone starting their coding journey.",
        "category": "Software Engineering", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Mosh Hamedani", "instructor_avatar": "https://randomuser.me/api/portraits/men/75.jpg",
        "instructor_title": "Software Engineer & Educator",
        "thumbnail": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&q=80",
        "tags": ["Python", "Programming", "Beginner", "Coding"],
        "what_you_learn": ["Write Python programs from scratch", "Understand variables, loops, and functions", "Work with files and data structures", "Build real-world Python projects"],
        "prerequisites": ["No prior programming experience needed"],
        "estimated_hours": 8, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Python Tutorial - Python Full Course for Beginners", "video_url": "https://www.youtube.com/watch?v=_uQrJ0TkZlc", "duration": "60 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is Python?", "options": ["A snake species", "A high-level programming language", "A database system", "An operating system"], "correct_answer": 1, "explanation": "Python is a high-level, interpreted programming language known for its simplicity and readability."},
                {"question": "Which symbol is used for comments in Python?", "options": ["//", "/* */", "#", "--"], "correct_answer": 2, "explanation": "In Python, the hash symbol (#) is used for single-line comments."},
                {"question": "What is the correct way to declare a variable in Python?", "options": ["var x = 5", "int x = 5", "x = 5", "let x = 5"], "correct_answer": 2, "explanation": "Python uses dynamic typing - you simply assign a value to a variable name without declaring its type."},
                {"question": "Which data type is used for text in Python?", "options": ["int", "float", "str", "bool"], "correct_answer": 2, "explanation": "The str (string) data type is used to represent text in Python."},
                {"question": "What does the print() function do?", "options": ["Prints to a printer", "Displays output to the console", "Creates a new file", "Reads user input"], "correct_answer": 1, "explanation": "The print() function outputs text or values to the console/terminal."}
            ]},
            {"title": "Python Variables and Data Types", "video_url": "https://www.youtube.com/watch?v=cQT33yu9pY8", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "Which of these is NOT a Python data type?", "options": ["integer", "string", "character", "boolean"], "correct_answer": 2, "explanation": "Python doesn't have a separate 'character' type - single characters are strings of length 1."},
                {"question": "What is the result of type(3.14)?", "options": ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'decimal'>"], "correct_answer": 1, "explanation": "3.14 is a floating-point number, so type() returns <class 'float'>."},
                {"question": "How do you convert a string '42' to an integer?", "options": ["string(42)", "int('42')", "convert('42')", "number('42')"], "correct_answer": 1, "explanation": "The int() function converts a string representation of a number to an integer."}
            ]},
            {"title": "Python Loops and Conditions", "video_url": "https://www.youtube.com/watch?v=6iF8Xb7Z3wQ", "duration": "30 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "Which keyword starts a conditional statement in Python?", "options": ["when", "if", "check", "case"], "correct_answer": 1, "explanation": "The 'if' keyword is used to start conditional statements in Python."},
                {"question": "What does a 'for' loop do?", "options": ["Runs code once", "Iterates over a sequence", "Checks a condition", "Defines a function"], "correct_answer": 1, "explanation": "A for loop iterates over items in a sequence (list, string, range, etc.)."},
                {"question": "What is the output of: for i in range(3): print(i)?", "options": ["1 2 3", "0 1 2", "0 1 2 3", "1 2"], "correct_answer": 1, "explanation": "range(3) generates 0, 1, 2 - it starts from 0 and stops before the given number."}
            ]},
            {"title": "Python Functions and Modules", "video_url": "https://www.youtube.com/watch?v=9Os0o3wzS_I", "duration": "35 min", "type": "video", "order": 3,
             "quiz": [
                {"question": "Which keyword is used to define a function?", "options": ["function", "func", "def", "define"], "correct_answer": 2, "explanation": "The 'def' keyword is used to define functions in Python."},
                {"question": "What does 'return' do in a function?", "options": ["Prints a value", "Sends a value back to the caller", "Stops the program", "Creates a variable"], "correct_answer": 1, "explanation": "The return statement sends a value back to wherever the function was called."},
                {"question": "What is a module in Python?", "options": ["A type of variable", "A file containing Python code", "A type of loop", "A data structure"], "correct_answer": 1, "explanation": "A module is a file containing Python definitions, functions, and statements that can be imported."}
            ]},
            {"title": "Python Lists, Dictionaries and File Handling", "video_url": "https://www.youtube.com/watch?v=W8KRzm-HUcc", "duration": "40 min", "type": "video", "order": 4,
             "quiz": [
                {"question": "How do you create an empty list?", "options": ["list = {}", "list = []", "list = ()", "list = ''"], "correct_answer": 1, "explanation": "Square brackets [] create an empty list in Python."},
                {"question": "What method adds an item to the end of a list?", "options": ["add()", "insert()", "append()", "push()"], "correct_answer": 2, "explanation": "The append() method adds an element to the end of a list."},
                {"question": "How do you access a value in a dictionary?", "options": ["dict.value", "dict[key]", "dict.get_value(key)", "dict->key"], "correct_answer": 1, "explanation": "You access dictionary values using square bracket notation with the key: dict[key]."}
            ]}
        ]
    },
    {
        "title": "Machine Learning Crash Course",
        "description": "Learn the fundamentals of machine learning with Google's crash course content. Covers supervised learning, regression, classification, neural networks, and model evaluation with practical examples using TensorFlow and scikit-learn.",
        "category": "AI", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Andrew Ng", "instructor_avatar": "https://randomuser.me/api/portraits/men/42.jpg",
        "instructor_title": "AI Pioneer & Stanford Professor",
        "thumbnail": "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80",
        "tags": ["Machine Learning", "AI", "TensorFlow", "scikit-learn", "Neural Networks"],
        "what_you_learn": ["Understand ML algorithms and when to use them", "Build classification and regression models", "Evaluate model performance", "Implement neural networks"],
        "prerequisites": ["Basic Python knowledge", "High school math"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Machine Learning Explained in 100 Seconds", "video_url": "https://www.youtube.com/watch?v=PeMlggyqz0Y", "duration": "12 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is supervised learning?", "options": ["Learning without data", "Learning from labeled data", "Learning without labels", "Learning from rewards"], "correct_answer": 1, "explanation": "Supervised learning uses labeled training data where both inputs and expected outputs are provided."},
                {"question": "Which is an example of classification?", "options": ["Predicting house prices", "Email spam detection", "Forecasting temperature", "Estimating sales"], "correct_answer": 1, "explanation": "Spam detection classifies emails into categories (spam/not spam), making it a classification task."},
                {"question": "What is a feature in ML?", "options": ["A product characteristic", "An input variable used for prediction", "The output variable", "A type of model"], "correct_answer": 1, "explanation": "A feature is an individual measurable property or characteristic used as input to a ML model."}
            ]},
            {"title": "Linear Regression - Explained Simply", "video_url": "https://www.youtube.com/watch?v=7ArmBVF2dCs", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does linear regression predict?", "options": ["Categories", "Continuous numerical values", "Images", "Text"], "correct_answer": 1, "explanation": "Linear regression predicts continuous numerical values based on input features."},
                {"question": "What is the 'line of best fit'?", "options": ["The longest line", "Line minimizing distance to data points", "A random line", "The steepest line"], "correct_answer": 1, "explanation": "The line of best fit minimizes the sum of squared distances between predicted and actual values."},
                {"question": "What is overfitting?", "options": ["Model is too simple", "Model memorizes training data but fails on new data", "Model has too few features", "Model trains too slowly"], "correct_answer": 1, "explanation": "Overfitting occurs when a model learns training data too well, including noise, and performs poorly on unseen data."}
            ]},
            {"title": "Neural Networks from Scratch", "video_url": "https://www.youtube.com/watch?v=aircAruvnKk", "duration": "20 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is a neuron in a neural network?", "options": ["A brain cell", "A computational unit that processes inputs", "A type of dataset", "A programming language"], "correct_answer": 1, "explanation": "In neural networks, a neuron is a computational unit that receives inputs, applies weights, and produces an output through an activation function."},
                {"question": "What is an activation function?", "options": ["Starts the computer", "Introduces non-linearity to the network", "Loads the dataset", "Saves the model"], "correct_answer": 1, "explanation": "Activation functions introduce non-linearity, enabling neural networks to learn complex patterns."},
                {"question": "What is backpropagation?", "options": ["Moving data backwards", "Algorithm to update weights by propagating error backwards", "Reversing predictions", "Deleting layers"], "correct_answer": 1, "explanation": "Backpropagation calculates gradients of the loss function and propagates them backward to update weights."}
            ]},
            {"title": "Model Evaluation & Metrics", "video_url": "https://www.youtube.com/watch?v=LbX4X71-TFI", "duration": "18 min", "type": "video", "order": 3,
             "quiz": [
                {"question": "What does accuracy measure?", "options": ["Speed of model", "Percentage of correct predictions", "Size of dataset", "Number of features"], "correct_answer": 1, "explanation": "Accuracy measures the proportion of correct predictions out of all predictions made."},
                {"question": "What is a confusion matrix?", "options": ["A matrix that confuses the model", "Table showing TP, TN, FP, FN", "A random data table", "Feature importance chart"], "correct_answer": 1, "explanation": "A confusion matrix shows True Positives, True Negatives, False Positives, and False Negatives."},
                {"question": "Why split data into train and test sets?", "options": ["To save storage", "To evaluate model on unseen data", "To make training faster", "It's not necessary"], "correct_answer": 1, "explanation": "Splitting data ensures the model is evaluated on data it hasn't seen during training, testing generalization."}
            ]}
        ]
    },
    {
        "title": "Docker & Containers for Beginners",
        "description": "Master containerization with Docker from the ground up. Learn to build images, manage containers, use Docker Compose for multi-container applications, and understand container networking and volumes.",
        "category": "DevOps", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Nana Janashia", "instructor_avatar": "https://randomuser.me/api/portraits/women/33.jpg",
        "instructor_title": "DevOps Engineer & Trainer",
        "thumbnail": "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&q=80",
        "tags": ["Docker", "Containers", "DevOps", "Microservices"],
        "what_you_learn": ["Understand containers vs VMs", "Build and manage Docker images", "Use Docker Compose", "Container networking and volumes"],
        "prerequisites": ["Basic command line knowledge"],
        "estimated_hours": 6, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Docker Tutorial for Beginners - Full Course", "video_url": "https://www.youtube.com/watch?v=fqMOX6JJhGo", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is a Docker container?", "options": ["A virtual machine", "A lightweight, isolated environment for running applications", "A programming language", "A cloud server"], "correct_answer": 1, "explanation": "A Docker container is a lightweight, standalone package that includes everything needed to run an application."},
                {"question": "What is a Dockerfile?", "options": ["A log file", "Instructions to build a Docker image", "A container runtime", "A config file for Docker Desktop"], "correct_answer": 1, "explanation": "A Dockerfile contains instructions that Docker uses to build an image layer by layer."},
                {"question": "How do containers differ from VMs?", "options": ["Containers are heavier", "Containers share the host OS kernel", "VMs are faster to start", "No difference"], "correct_answer": 1, "explanation": "Containers share the host OS kernel making them much lighter and faster than VMs which each need a full OS."}
            ]},
            {"title": "Docker Images & Containers Deep Dive", "video_url": "https://www.youtube.com/watch?v=pg19Z8LL06w", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What command runs a container?", "options": ["docker start", "docker run", "docker create", "docker init"], "correct_answer": 1, "explanation": "The 'docker run' command creates and starts a new container from an image."},
                {"question": "What does 'docker pull' do?", "options": ["Removes an image", "Downloads an image from a registry", "Uploads an image", "Lists images"], "correct_answer": 1, "explanation": "docker pull downloads a container image from a registry like Docker Hub."},
                {"question": "What is Docker Hub?", "options": ["A container runtime", "A public registry for Docker images", "A Docker IDE", "A monitoring tool"], "correct_answer": 1, "explanation": "Docker Hub is a cloud-based registry where Docker images are stored and shared publicly or privately."}
            ]},
            {"title": "Docker Compose Tutorial", "video_url": "https://www.youtube.com/watch?v=HG6yIjZapSA", "duration": "20 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is Docker Compose used for?", "options": ["Building single containers", "Defining and running multi-container applications", "Monitoring containers", "Securing images"], "correct_answer": 1, "explanation": "Docker Compose allows you to define and manage multi-container Docker applications using a YAML file."},
                {"question": "What file does Docker Compose use?", "options": ["Dockerfile", "docker-compose.yml", "compose.json", "docker.config"], "correct_answer": 1, "explanation": "Docker Compose uses docker-compose.yml (or compose.yml) to define services, networks, and volumes."},
                {"question": "What command starts all services in a Compose file?", "options": ["docker compose start", "docker compose up", "docker compose run", "docker compose init"], "correct_answer": 1, "explanation": "docker compose up creates and starts all services defined in the compose file."}
            ]}
        ]
    },
    {
        "title": "Cybersecurity Fundamentals",
        "description": "Essential cybersecurity knowledge for everyone. Learn about threats, vulnerabilities, encryption, network security, social engineering, and best practices to protect systems and data in the digital age.",
        "category": "Cybersecurity", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "David Bombal", "instructor_avatar": "https://randomuser.me/api/portraits/men/55.jpg",
        "instructor_title": "Cybersecurity Expert & Certified Ethical Hacker",
        "thumbnail": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80",
        "tags": ["Cybersecurity", "Security", "Networking", "Ethical Hacking"],
        "what_you_learn": ["Identify common cyber threats", "Understand encryption and authentication", "Learn network security basics", "Apply security best practices"],
        "prerequisites": ["Basic computer literacy"],
        "estimated_hours": 7, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Cybersecurity Full Course for Beginners", "video_url": "https://www.youtube.com/watch?v=U_P23SqJaDc", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is the CIA triad in cybersecurity?", "options": ["A spy organization", "Confidentiality, Integrity, Availability", "Computer, Internet, Application", "Create, Implement, Audit"], "correct_answer": 1, "explanation": "The CIA triad represents the three core principles of information security."},
                {"question": "What is phishing?", "options": ["A fishing technique", "Fraudulent attempt to obtain sensitive information via deception", "A type of firewall", "Network scanning"], "correct_answer": 1, "explanation": "Phishing uses fake emails, websites, or messages to trick victims into revealing sensitive information."},
                {"question": "What is malware?", "options": ["Good software", "Malicious software designed to harm systems", "Anti-virus software", "A type of hardware"], "correct_answer": 1, "explanation": "Malware is any software intentionally designed to cause damage, steal data, or gain unauthorized access."}
            ]},
            {"title": "Encryption Explained Simply", "video_url": "https://www.youtube.com/watch?v=AQDCe585Lnc", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does encryption do?", "options": ["Deletes data", "Converts data into unreadable format", "Speeds up network", "Compresses files"], "correct_answer": 1, "explanation": "Encryption converts plaintext into ciphertext that can only be read with the correct decryption key."},
                {"question": "What is the difference between symmetric and asymmetric encryption?", "options": ["No difference", "Symmetric uses one key, asymmetric uses a key pair", "Asymmetric is weaker", "Symmetric uses two keys"], "correct_answer": 1, "explanation": "Symmetric encryption uses one shared key; asymmetric uses a public/private key pair."},
                {"question": "What is HTTPS?", "options": ["A programming language", "HTTP secured with TLS/SSL encryption", "A type of database", "A firewall protocol"], "correct_answer": 1, "explanation": "HTTPS is HTTP over TLS/SSL, encrypting data between browser and server for secure communication."}
            ]},
            {"title": "Network Security Basics", "video_url": "https://www.youtube.com/watch?v=E03gh1huvW4", "duration": "25 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is a firewall?", "options": ["A type of virus", "A security system that monitors and controls network traffic", "A programming tool", "A hardware component"], "correct_answer": 1, "explanation": "A firewall monitors incoming and outgoing network traffic and blocks unauthorized access."},
                {"question": "What is a VPN?", "options": ["Virtual Private Network", "Very Private Network", "Visual Programming Node", "Variable Proxy Network"], "correct_answer": 0, "explanation": "A VPN (Virtual Private Network) creates an encrypted tunnel for secure internet communication."},
                {"question": "What is two-factor authentication (2FA)?", "options": ["Using two passwords", "Verification using two different methods", "Two firewalls", "Double encryption"], "correct_answer": 1, "explanation": "2FA requires two different verification methods (e.g., password + phone code) for enhanced security."}
            ]}
        ]
    },
    {
        "title": "Data Science with Python",
        "description": "Complete introduction to data science using Python. Learn data analysis with pandas, visualization with matplotlib, statistics fundamentals, and how to extract insights from real-world datasets.",
        "category": "Data Science", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Alex The Analyst", "instructor_avatar": "https://randomuser.me/api/portraits/men/22.jpg",
        "instructor_title": "Data Analyst & YouTuber",
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
        "tags": ["Data Science", "Python", "Pandas", "Data Analysis", "Visualization"],
        "what_you_learn": ["Analyze data with pandas", "Create visualizations with matplotlib", "Understand statistics for data science", "Clean and prepare real-world datasets"],
        "prerequisites": ["Basic Python knowledge"],
        "estimated_hours": 9, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Data Analysis with Python - Full Course", "video_url": "https://www.youtube.com/watch?v=r-uOLxNrNk8", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is pandas in Python?", "options": ["An animal library", "A data manipulation and analysis library", "A web framework", "A game engine"], "correct_answer": 1, "explanation": "pandas is a Python library providing data structures and tools for efficient data manipulation and analysis."},
                {"question": "What is a DataFrame?", "options": ["A picture frame", "A 2-dimensional labeled data structure", "A type of chart", "A database connection"], "correct_answer": 1, "explanation": "A DataFrame is a 2-dimensional labeled data structure with columns of potentially different types, like a spreadsheet."},
                {"question": "How do you read a CSV file in pandas?", "options": ["pd.open_csv()", "pd.read_csv()", "pd.load_csv()", "pd.import_csv()"], "correct_answer": 1, "explanation": "pd.read_csv() reads a comma-separated values file into a pandas DataFrame."}
            ]},
            {"title": "Data Visualization with Matplotlib", "video_url": "https://www.youtube.com/watch?v=3Xc3CA655Y4", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is matplotlib?", "options": ["A math library", "A plotting library for creating visualizations", "A machine learning framework", "A database tool"], "correct_answer": 1, "explanation": "matplotlib is Python's primary plotting library for creating static, animated, and interactive visualizations."},
                {"question": "Which chart type is best for showing trends over time?", "options": ["Pie chart", "Line chart", "Bar chart", "Scatter plot"], "correct_answer": 1, "explanation": "Line charts are ideal for showing how values change over time, making trends easy to identify."},
                {"question": "What does plt.show() do?", "options": ["Saves the plot", "Displays the plot", "Clears the plot", "Creates a new plot"], "correct_answer": 1, "explanation": "plt.show() renders and displays the current figure in a window or notebook."}
            ]},
            {"title": "Statistics for Data Science", "video_url": "https://www.youtube.com/watch?v=xxpc-HPKN28", "duration": "35 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is the mean?", "options": ["The middle value", "The average of all values", "The most frequent value", "The range of values"], "correct_answer": 1, "explanation": "The mean (average) is calculated by summing all values and dividing by the count."},
                {"question": "What is the median?", "options": ["The average", "The middle value when data is sorted", "The most common value", "The largest value"], "correct_answer": 1, "explanation": "The median is the middle value in a sorted dataset, dividing it into two equal halves."},
                {"question": "What does standard deviation measure?", "options": ["The average", "The spread/dispersion of data", "The total sum", "The count of data points"], "correct_answer": 1, "explanation": "Standard deviation measures how spread out values are from the mean — higher means more dispersed."}
            ]}
        ]
    },
    {
        "title": "AWS Cloud Practitioner Essentials",
        "description": "Prepare for the AWS Cloud Practitioner certification. Learn core AWS services, cloud architecture, pricing, security, and the shared responsibility model. Ideal for anyone starting their cloud journey.",
        "category": "Cloud", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Stephane Maarek", "instructor_avatar": "https://randomuser.me/api/portraits/men/36.jpg",
        "instructor_title": "AWS Certified Solutions Architect",
        "thumbnail": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&q=80",
        "tags": ["AWS", "Cloud", "Certification", "Cloud Practitioner"],
        "what_you_learn": ["Understand core AWS services (EC2, S3, RDS, Lambda)", "Learn cloud architecture principles", "AWS pricing and billing", "Security and compliance basics"],
        "prerequisites": ["Basic IT knowledge"],
        "estimated_hours": 8, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "AWS Certified Cloud Practitioner - Full Course", "video_url": "https://www.youtube.com/watch?v=SOTamWNgDKc", "duration": "45 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is AWS?", "options": ["A programming language", "Amazon Web Services - a cloud computing platform", "A database system", "An operating system"], "correct_answer": 1, "explanation": "AWS (Amazon Web Services) is a comprehensive cloud computing platform offering 200+ services."},
                {"question": "What is Amazon EC2?", "options": ["A storage service", "A virtual server in the cloud", "A database service", "A networking tool"], "correct_answer": 1, "explanation": "EC2 (Elastic Compute Cloud) provides resizable virtual servers (instances) in the cloud."},
                {"question": "What is Amazon S3?", "options": ["A compute service", "An object storage service", "A database", "A CDN"], "correct_answer": 1, "explanation": "S3 (Simple Storage Service) is an object storage service for storing and retrieving any amount of data."}
            ]},
            {"title": "AWS Services Overview", "video_url": "https://www.youtube.com/watch?v=JIbIYCM48to", "duration": "30 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is AWS Lambda?", "options": ["A VM service", "A serverless compute service", "A storage service", "A monitoring tool"], "correct_answer": 1, "explanation": "AWS Lambda runs code without provisioning servers — you only pay for compute time consumed."},
                {"question": "What does IAM stand for?", "options": ["Internet Access Manager", "Identity and Access Management", "Integrated Application Monitor", "Instance Auto Manager"], "correct_answer": 1, "explanation": "IAM (Identity and Access Management) manages users, groups, and permissions in AWS."},
                {"question": "What is the shared responsibility model?", "options": ["AWS handles everything", "Customer handles everything", "AWS secures infrastructure, customer secures data and apps", "Neither is responsible"], "correct_answer": 2, "explanation": "AWS is responsible for security OF the cloud; customers are responsible for security IN the cloud."}
            ]},
            {"title": "AWS Pricing and Cost Management", "video_url": "https://www.youtube.com/watch?v=a9__D53WsUs", "duration": "20 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is the AWS Free Tier?", "options": ["A paid plan", "Free access to certain AWS services for limited usage", "A premium tier", "A support plan"], "correct_answer": 1, "explanation": "The AWS Free Tier provides free access to various AWS services within specified limits for 12 months."},
                {"question": "What pricing model does AWS primarily use?", "options": ["Fixed monthly fee", "Pay-as-you-go", "Annual contract only", "Free for all"], "correct_answer": 1, "explanation": "AWS uses a pay-as-you-go model where you only pay for the resources you actually consume."}
            ]}
        ]
    },
    {
        "title": "React.js Complete Guide",
        "description": "Learn React.js from scratch to advanced concepts. Cover components, hooks, state management, routing, API integration, and build a complete web application. The most popular frontend framework for modern web development.",
        "category": "Software Engineering", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Traversy Media", "instructor_avatar": "https://randomuser.me/api/portraits/men/68.jpg",
        "instructor_title": "Full Stack Developer & Educator",
        "thumbnail": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80",
        "tags": ["React", "JavaScript", "Frontend", "Web Development"],
        "what_you_learn": ["Build modern UIs with React components", "Manage state with hooks", "Handle routing and navigation", "Integrate with REST APIs"],
        "prerequisites": ["HTML, CSS, and JavaScript basics"],
        "estimated_hours": 10, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "React JS Full Course for Beginners", "video_url": "https://www.youtube.com/watch?v=b9eMGE7QtTk", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is React?", "options": ["A backend framework", "A JavaScript library for building UIs", "A database", "A CSS framework"], "correct_answer": 1, "explanation": "React is a JavaScript library created by Facebook for building user interfaces, especially single-page applications."},
                {"question": "What is JSX?", "options": ["A new language", "JavaScript XML - syntax extension for JavaScript", "A CSS preprocessor", "A testing framework"], "correct_answer": 1, "explanation": "JSX is a syntax extension that allows writing HTML-like code within JavaScript files."},
                {"question": "What is a React component?", "options": ["A CSS class", "A reusable piece of UI", "A database table", "A server endpoint"], "correct_answer": 1, "explanation": "A React component is a reusable, self-contained piece of UI that can accept inputs (props) and return elements."}
            ]},
            {"title": "React Hooks Explained", "video_url": "https://www.youtube.com/watch?v=TNhaISOUy6Q", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does useState do?", "options": ["Creates a database", "Adds state to functional components", "Makes API calls", "Handles routing"], "correct_answer": 1, "explanation": "useState is a Hook that lets you add state variables to functional components."},
                {"question": "When does useEffect run?", "options": ["Only on mount", "After every render (by default)", "Only on unmount", "Never automatically"], "correct_answer": 1, "explanation": "useEffect runs after every render by default, but can be controlled with a dependency array."},
                {"question": "What are props?", "options": ["State variables", "Read-only data passed from parent to child", "CSS properties", "Event handlers"], "correct_answer": 1, "explanation": "Props (properties) are read-only data passed from a parent component to a child component."}
            ]},
            {"title": "React Router & Navigation", "video_url": "https://www.youtube.com/watch?v=Ul3y1LXxzdU", "duration": "20 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is React Router?", "options": ["A state manager", "A library for navigation in React apps", "A testing library", "A CSS framework"], "correct_answer": 1, "explanation": "React Router is the standard library for handling client-side routing and navigation in React applications."},
                {"question": "What does the <Route> component do?", "options": ["Makes API calls", "Maps a URL path to a component", "Styles elements", "Creates state"], "correct_answer": 1, "explanation": "The Route component renders a specific component when the current URL matches its path prop."},
                {"question": "What is the difference between Link and anchor tag?", "options": ["No difference", "Link prevents full page reload", "Anchor is faster", "Link is for external URLs"], "correct_answer": 1, "explanation": "Link from React Router navigates without a full page reload, preserving app state and providing faster navigation."}
            ]}
        ]
    },
    {
        "title": "Generative AI & Large Language Models",
        "description": "Understand how generative AI and large language models work. Learn about transformers, GPT architecture, prompt engineering, fine-tuning, RAG, and responsible AI deployment. Stay ahead in the AI revolution.",
        "category": "AI", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Andrej Karpathy", "instructor_avatar": "https://randomuser.me/api/portraits/men/52.jpg",
        "instructor_title": "Former Director of AI at Tesla",
        "thumbnail": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80",
        "tags": ["Generative AI", "LLM", "GPT", "Transformers", "Prompt Engineering"],
        "what_you_learn": ["How transformers and LLMs work", "Effective prompt engineering", "RAG and fine-tuning techniques", "Responsible AI deployment"],
        "prerequisites": ["Basic understanding of AI/ML concepts"],
        "estimated_hours": 8, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "How Large Language Models Work", "video_url": "https://www.youtube.com/watch?v=zjkBMFhNj_g", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is a Large Language Model (LLM)?", "options": ["A large dictionary", "An AI model trained on vast text data to understand and generate language", "A translation tool", "A search engine"], "correct_answer": 1, "explanation": "LLMs are AI models trained on massive text datasets that can understand context and generate human-like text."},
                {"question": "What is the Transformer architecture?", "options": ["A robot design", "A neural network architecture using attention mechanisms", "A data format", "A hardware chip"], "correct_answer": 1, "explanation": "The Transformer uses self-attention mechanisms to process text in parallel, enabling efficient training on large datasets."},
                {"question": "What does 'GPT' stand for?", "options": ["General Purpose Technology", "Generative Pre-trained Transformer", "Global Processing Tool", "Graphical Programming Terminal"], "correct_answer": 1, "explanation": "GPT stands for Generative Pre-trained Transformer — a model that generates text based on pre-training on large corpora."}
            ]},
            {"title": "Prompt Engineering Masterclass", "video_url": "https://www.youtube.com/watch?v=_ZvnD96BbJI", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is prompt engineering?", "options": ["Building engines", "Crafting effective inputs to get desired outputs from AI", "Programming prompts", "Designing GUIs"], "correct_answer": 1, "explanation": "Prompt engineering is the art of designing inputs that guide AI models to produce specific, high-quality outputs."},
                {"question": "What is chain-of-thought prompting?", "options": ["Linking multiple AIs", "Asking the model to show reasoning step by step", "A type of fine-tuning", "Chaining API calls"], "correct_answer": 1, "explanation": "Chain-of-thought prompting asks the model to break down its reasoning into steps, improving accuracy on complex tasks."},
                {"question": "What is few-shot learning in prompting?", "options": ["Training with little data", "Providing examples in the prompt to guide the model", "Using small models", "Quick training"], "correct_answer": 1, "explanation": "Few-shot learning provides a few examples in the prompt to demonstrate the desired output format and behavior."}
            ]},
            {"title": "RAG - Retrieval Augmented Generation", "video_url": "https://www.youtube.com/watch?v=T-D1OfcDW1M", "duration": "22 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What is RAG?", "options": ["Random AI Generation", "Retrieval Augmented Generation - combining search with LLM", "Rapid Algorithm Generator", "Real-time AI Gateway"], "correct_answer": 1, "explanation": "RAG combines information retrieval with language generation, allowing LLMs to access external knowledge."},
                {"question": "Why use RAG instead of just an LLM?", "options": ["It's cheaper", "To provide up-to-date, factual information beyond training data", "It's faster", "No real advantage"], "correct_answer": 1, "explanation": "RAG grounds LLM responses in retrieved documents, reducing hallucinations and providing current information."},
                {"question": "What is fine-tuning?", "options": ["Adjusting volume", "Training a pre-trained model on specific data for a task", "Debugging code", "Optimizing hardware"], "correct_answer": 1, "explanation": "Fine-tuning adapts a pre-trained model to a specific domain or task by training it on specialized data."}
            ]},
            {"title": "Building AI Applications with LLMs", "video_url": "https://www.youtube.com/watch?v=jkrNMKz9pWU", "duration": "28 min", "type": "video", "order": 3,
             "quiz": [
                {"question": "What is an AI agent?", "options": ["A human AI researcher", "An AI system that can take actions and make decisions autonomously", "An AI chatbot only", "A robot"], "correct_answer": 1, "explanation": "An AI agent is a system that can perceive its environment, make decisions, and take actions to achieve goals."},
                {"question": "What is token in the context of LLMs?", "options": ["A cryptocurrency", "A piece of text (word or subword) processed by the model", "An API key", "A permission"], "correct_answer": 1, "explanation": "A token is the basic unit of text that LLMs process — typically a word, part of a word, or punctuation."},
                {"question": "What is 'hallucination' in AI?", "options": ["AI seeing images", "When AI generates false or fabricated information confidently", "AI dreaming", "A hardware error"], "correct_answer": 1, "explanation": "Hallucination is when an AI model generates plausible-sounding but factually incorrect or fabricated information."}
            ]}
        ]
    }
]

def seed():
    for course in COURSES:
        r = requests.post(f"{API_URL}/api/academy/admin/courses", headers=HEADERS, json=course)
        if r.status_code == 200:
            d = r.json()
            print(f"  Created: {d.get('course',{}).get('title','?')[:50]} ({len(course['lessons'])} lessons)")
        else:
            print(f"  FAILED: {course['title'][:40]} - {r.status_code}: {r.text[:100]}")

if __name__ == "__main__":
    print(f"Seeding {len(COURSES)} courses to {API_URL}...")
    seed()
    print("Done!")
