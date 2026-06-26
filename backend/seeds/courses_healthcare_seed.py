#!/usr/bin/env python3
"""Seed healthcare/PSW training courses with real free YouTube content."""
import sys, requests

API_URL = sys.argv[1]
TOKEN = sys.argv[2]
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

COURSES = [
    {
        "title": "Standard First Aid & Emergency Response",
        "description": "Learn essential first aid skills for workplace and everyday emergencies. Covers wound care, fractures, burns, choking, shock, poisoning, and when to call emergency services. Based on Red Cross and St. John Ambulance standards.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "St. John Ambulance", "instructor_avatar": "https://randomuser.me/api/portraits/men/81.jpg",
        "instructor_title": "First Aid Training Provider",
        "thumbnail": "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&q=80",
        "tags": ["First Aid", "Healthcare", "Emergency", "CPR", "Workplace Safety"],
        "what_you_learn": ["Assess emergency situations safely", "Treat wounds, burns, and fractures", "Manage choking and allergic reactions", "When and how to call emergency services"],
        "prerequisites": ["None"],
        "estimated_hours": 4, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "First Aid Full Course - Everything You Need to Know", "video_url": "https://www.youtube.com/watch?v=EA-VCkJmIhc", "duration": "40 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What should you do FIRST when arriving at an emergency scene?", "options": ["Start CPR immediately", "Check if the scene is safe", "Call 911", "Move the patient"], "correct_answer": 1, "explanation": "Scene safety is always the first priority — you cannot help others if you become a victim yourself."},
                {"question": "How do you treat a severe bleeding wound?", "options": ["Apply a tourniquet first", "Apply direct pressure with a clean cloth", "Pour water on it", "Leave it open to air"], "correct_answer": 1, "explanation": "Apply firm, direct pressure with a clean cloth or bandage to control severe bleeding while calling for help."},
                {"question": "What is the recovery position used for?", "options": ["Broken bones", "Unconscious breathing patients to keep airways clear", "Heart attacks", "Burns"], "correct_answer": 1, "explanation": "The recovery position keeps an unconscious, breathing person's airway clear and allows fluids to drain."},
                {"question": "What are the signs of shock?", "options": ["High energy", "Pale, cold, clammy skin, rapid pulse, confusion", "Fever and cough", "Joint pain"], "correct_answer": 1, "explanation": "Shock signs include pale/clammy skin, rapid weak pulse, rapid breathing, confusion, and feeling faint."}
            ]},
            {"title": "Wound Care & Bandaging Techniques", "video_url": "https://www.youtube.com/watch?v=rjnHbdJmNzo", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What is the purpose of a triangular bandage?", "options": ["Decoration", "Create slings and secure dressings", "Measure temperature", "Clean wounds"], "correct_answer": 1, "explanation": "Triangular bandages are versatile — used for arm slings, securing splints, and holding dressings in place."},
                {"question": "When should you NOT remove an embedded object from a wound?", "options": ["Never remove it", "Always remove it", "Only if it's large or deeply embedded", "Only in a hospital"], "correct_answer": 2, "explanation": "Large or deeply embedded objects should be stabilized in place, not removed, as removal could worsen bleeding."}
            ]}
        ]
    },
    {
        "title": "CPR & AED Certification Training",
        "description": "Comprehensive CPR and AED training for adults, children, and infants. Learn chest compressions, rescue breaths, AED operation, and the chain of survival. Essential for healthcare workers and the general public.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "ProCPR", "instructor_avatar": "https://randomuser.me/api/portraits/women/71.jpg",
        "instructor_title": "CPR & Emergency Training",
        "thumbnail": "https://images.unsplash.com/photo-1559757175-7cb057fba93c?w=600&q=80",
        "tags": ["CPR", "AED", "Healthcare", "Life Support", "Emergency"],
        "what_you_learn": ["Perform CPR on adults, children, and infants", "Operate an AED (Automated External Defibrillator)", "Recognize cardiac arrest", "Understand the chain of survival"],
        "prerequisites": ["None"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "CPR Training - Adult, Child, Infant", "video_url": "https://www.youtube.com/watch?v=cosVBV96E2g", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is the correct compression rate for adult CPR?", "options": ["60 per minute", "80 per minute", "100-120 per minute", "150 per minute"], "correct_answer": 2, "explanation": "The recommended compression rate is 100-120 per minute for effective CPR on adults."},
                {"question": "How deep should chest compressions be for an adult?", "options": ["1 inch", "At least 2 inches (5 cm)", "3 inches", "As deep as possible"], "correct_answer": 1, "explanation": "Adult chest compressions should be at least 2 inches (5 cm) deep but not exceed 2.4 inches."},
                {"question": "What is the compression-to-breath ratio for single-rescuer adult CPR?", "options": ["15:2", "30:2", "20:2", "10:1"], "correct_answer": 1, "explanation": "The standard ratio is 30 compressions to 2 rescue breaths for single-rescuer adult CPR."},
                {"question": "What does AED stand for?", "options": ["Automatic Emergency Device", "Automated External Defibrillator", "Advanced Emergency Diagnostic", "Acute Emergency Department"], "correct_answer": 1, "explanation": "AED stands for Automated External Defibrillator — it analyzes heart rhythm and delivers a shock if needed."}
            ]},
            {"title": "How to Use an AED - Step by Step", "video_url": "https://www.youtube.com/watch?v=UFvL7wTFzl0", "duration": "15 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "When should you use an AED?", "options": ["For any unconscious person", "When a person is unresponsive and not breathing normally", "Only for chest pain", "Only in hospitals"], "correct_answer": 1, "explanation": "Use an AED when someone is unresponsive and not breathing normally — it will analyze if a shock is needed."},
                {"question": "Should you stop CPR when applying AED pads?", "options": ["Yes, stop completely", "Minimize interruptions — keep compressions going while pads are applied", "Only stop for 5 minutes", "Don't use AED during CPR"], "correct_answer": 1, "explanation": "Minimize pauses in CPR. One person can continue compressions while another applies the AED pads."}
            ]}
        ]
    },
    {
        "title": "Basic Life Support (BLS) for Healthcare Providers",
        "description": "BLS training designed for healthcare professionals. Covers high-quality CPR, team dynamics, bag-valve mask ventilation, opioid emergencies, and multi-rescuer response following AHA guidelines.",
        "category": "Healthcare", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "AHA Training", "instructor_avatar": "https://randomuser.me/api/portraits/men/83.jpg",
        "instructor_title": "Healthcare Education Provider",
        "thumbnail": "https://images.unsplash.com/photo-1631815588090-d4bfec5b1b89?w=600&q=80",
        "tags": ["BLS", "Healthcare", "CPR", "Life Support", "Clinical"],
        "what_you_learn": ["High-quality CPR techniques", "Multi-rescuer BLS protocols", "Bag-valve mask ventilation", "Team dynamics in resuscitation"],
        "prerequisites": ["Basic CPR knowledge recommended"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "BLS Full Course for Healthcare Providers", "video_url": "https://www.youtube.com/watch?v=O4cSTykVAMA", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is the difference between BLS and standard CPR?", "options": ["No difference", "BLS includes advanced airway management and team-based protocols for healthcare workers", "BLS is easier", "BLS doesn't use compressions"], "correct_answer": 1, "explanation": "BLS is designed for healthcare providers and includes advanced techniques like bag-valve mask use and team coordination."},
                {"question": "In a 2-person BLS team, what is the compressor's role?", "options": ["Give breaths only", "Perform chest compressions and switch every 2 minutes", "Operate the AED only", "Call for help"], "correct_answer": 1, "explanation": "The compressor delivers high-quality compressions and switches roles every 2 minutes to prevent fatigue."},
                {"question": "What should you do for an opioid overdose?", "options": ["Only call 911", "Give naloxone (Narcan) if available, start CPR if needed", "Wait and observe", "Give aspirin"], "correct_answer": 1, "explanation": "Administer naloxone if available, provide rescue breathing or CPR as needed, and call emergency services."}
            ]}
        ]
    },
    {
        "title": "Infection Prevention & Control (IPAC)",
        "description": "Essential infection prevention and control practices for healthcare settings. Learn about chain of infection, hand hygiene, PPE usage, cleaning and disinfection, isolation precautions, and outbreak management.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Public Health Ontario", "instructor_avatar": "https://randomuser.me/api/portraits/women/56.jpg",
        "instructor_title": "Infection Control Specialist",
        "thumbnail": "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=600&q=80",
        "tags": ["IPAC", "Infection Control", "Healthcare", "Hygiene", "PPE"],
        "what_you_learn": ["Break the chain of infection", "Proper hand hygiene techniques", "Correct PPE donning and doffing", "Cleaning and disinfection protocols"],
        "prerequisites": ["None"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "Infection Prevention and Control Training", "video_url": "https://www.youtube.com/watch?v=EJbjyo2xa2o", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What are the links in the chain of infection?", "options": ["Only germs and people", "Infectious agent, reservoir, portal of exit, mode of transmission, portal of entry, susceptible host", "Doctor, patient, hospital", "Virus, bacteria, fungi"], "correct_answer": 1, "explanation": "The chain of infection has 6 links — breaking any one link prevents infection from spreading."},
                {"question": "What are the 4 moments of hand hygiene?", "options": ["Before and after meals", "Before patient contact, before procedure, after body fluid exposure, after patient contact", "Morning, noon, evening, night", "Only when visibly dirty"], "correct_answer": 1, "explanation": "The 4 moments ensure hands are cleaned at critical points to prevent healthcare-associated infections."},
                {"question": "What is the correct order for donning PPE?", "options": ["Gloves, gown, mask, goggles", "Gown, mask/respirator, goggles/face shield, gloves", "Mask, gloves, gown, goggles", "Any order is fine"], "correct_answer": 1, "explanation": "Correct donning order: gown first, then mask/respirator, then eye protection, and gloves last."},
                {"question": "What are droplet precautions used for?", "options": ["Airborne diseases", "Infections spread by large droplets (flu, COVID, meningitis)", "Contact infections only", "Waterborne diseases"], "correct_answer": 1, "explanation": "Droplet precautions prevent infections spread through large respiratory droplets from coughing, sneezing, or talking."}
            ]},
            {"title": "Hand Hygiene & PPE Donning/Doffing", "video_url": "https://www.youtube.com/watch?v=u5dORIClGWU", "duration": "15 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "How long should you wash hands with soap and water?", "options": ["5 seconds", "At least 20 seconds", "1 minute", "10 seconds"], "correct_answer": 1, "explanation": "Wash hands for at least 20 seconds with soap and water, covering all surfaces of hands and between fingers."},
                {"question": "When should you use alcohol-based hand rub vs soap and water?", "options": ["Always use hand rub", "Use soap and water when hands are visibly soiled; hand rub when they're not", "Always use soap", "It doesn't matter"], "correct_answer": 1, "explanation": "Alcohol-based hand rub is preferred when hands aren't visibly dirty; soap and water is required for visible soiling."}
            ]}
        ]
    },
    {
        "title": "WHMIS 2015 - Workplace Hazardous Materials",
        "description": "Complete WHMIS 2015 training aligned with the Globally Harmonized System (GHS). Learn hazard classification, safety data sheets, workplace labels, pictograms, and safe handling of hazardous materials.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "CCOHS Training", "instructor_avatar": "https://randomuser.me/api/portraits/men/86.jpg",
        "instructor_title": "Occupational Health & Safety",
        "thumbnail": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&q=80",
        "tags": ["WHMIS", "Safety", "Hazardous Materials", "Healthcare", "Workplace"],
        "what_you_learn": ["WHMIS 2015 hazard classifications", "Read Safety Data Sheets (SDS)", "Recognize GHS pictograms", "Safe handling and storage procedures"],
        "prerequisites": ["None"],
        "estimated_hours": 2, "status": "published", "pass_threshold": 80,
        "lessons": [
            {"title": "WHMIS 2015 Training - Complete Course", "video_url": "https://www.youtube.com/watch?v=s9RjGMg1hJg", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What does WHMIS stand for?", "options": ["Workplace Health Monitoring Information System", "Workplace Hazardous Materials Information System", "Worker Health & Medical Insurance Standard", "Workplace Handling Methods & Inspection Standards"], "correct_answer": 1, "explanation": "WHMIS = Workplace Hazardous Materials Information System — Canada's hazard communication standard."},
                {"question": "How many sections does a Safety Data Sheet (SDS) have?", "options": ["8", "12", "16", "20"], "correct_answer": 2, "explanation": "An SDS has 16 standardized sections covering identification, hazards, composition, first aid, handling, and more."},
                {"question": "What does the skull and crossbones pictogram indicate?", "options": ["Poison/radiation", "Acute toxicity — can cause death or serious harm", "Flammable material", "Corrosive material"], "correct_answer": 1, "explanation": "The skull and crossbones warns of acute toxicity — the substance can cause death or serious harm with brief exposure."},
                {"question": "What are the 3 key elements of WHMIS?", "options": ["Labels, gloves, goggles", "Labels, Safety Data Sheets, worker education/training", "Signs, alarms, exits", "PPE, ventilation, storage"], "correct_answer": 1, "explanation": "WHMIS relies on three pillars: hazard labels, Safety Data Sheets (SDS), and worker education and training."}
            ]}
        ]
    },
    {
        "title": "Safe Patient Handling & Transfers",
        "description": "Learn proper body mechanics and safe patient handling techniques. Covers bed mobility, transfers, Hoyer lift operation, wheelchair safety, fall prevention, and ergonomic practices to prevent workplace injuries.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "CNA Training Academy", "instructor_avatar": "https://randomuser.me/api/portraits/women/62.jpg",
        "instructor_title": "Clinical Nursing Educator",
        "thumbnail": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
        "tags": ["Patient Handling", "Transfers", "Hoyer Lift", "Healthcare", "PSW"],
        "what_you_learn": ["Proper body mechanics for lifting", "Bed-to-wheelchair transfers", "Hoyer lift safe operation", "Fall prevention strategies"],
        "prerequisites": ["None"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "Patient Transfer Techniques - Complete Guide", "video_url": "https://www.youtube.com/watch?v=AjR6S2sHvPw", "duration": "25 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is the most important principle of safe patient handling?", "options": ["Speed", "Proper body mechanics and using equipment when available", "Having many helpers", "Strong arms"], "correct_answer": 1, "explanation": "Proper body mechanics (bend knees, straight back, core engaged) and mechanical aids prevent injuries to both staff and patients."},
                {"question": "When performing a bed-to-wheelchair transfer, where should the wheelchair be placed?", "options": ["At the foot of the bed", "At a 45-degree angle on the patient's stronger side", "Behind the patient", "Across the room"], "correct_answer": 1, "explanation": "Place the wheelchair at 45 degrees on the patient's stronger side, locked, with footrests folded, for the safest transfer."},
                {"question": "When must you use a mechanical lift (Hoyer lift)?", "options": ["For any transfer", "When the patient cannot bear weight or is too heavy for manual transfer", "Only for obese patients", "Never in home care"], "correct_answer": 1, "explanation": "Mechanical lifts are required when patients cannot bear weight or when manual lifting poses injury risk to staff."}
            ]},
            {"title": "Hoyer Lift Training - Safe Operation", "video_url": "https://www.youtube.com/watch?v=vGeloiYd7TQ", "duration": "15 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What should you check BEFORE using a Hoyer lift?", "options": ["Nothing special", "Sling condition, weight capacity, battery charge, and brakes", "Only the battery", "Ask the patient"], "correct_answer": 1, "explanation": "Always inspect the sling for tears, verify weight capacity, check battery/hydraulics, and ensure brakes work before use."},
                {"question": "How many caregivers are recommended for a Hoyer lift transfer?", "options": ["1", "At least 2", "3 or more", "Doesn't matter"], "correct_answer": 1, "explanation": "A minimum of 2 caregivers is recommended — one to operate the lift and one to guide the patient and ensure safety."}
            ]},
            {"title": "Wheelchair Safety & Fall Prevention", "video_url": "https://www.youtube.com/watch?v=7vxMiL7ASLA", "duration": "18 min", "type": "video", "order": 2,
             "quiz": [
                {"question": "What should always be done before transferring a patient to/from a wheelchair?", "options": ["Remove the cushion", "Lock the brakes and fold up footrests", "Tilt the wheelchair", "Remove armrests"], "correct_answer": 1, "explanation": "Always lock the brakes and fold/remove footrests before any transfer to prevent the wheelchair from rolling."},
                {"question": "What is the #1 cause of falls in healthcare settings?", "options": ["Wet floors only", "Combination of patient factors (weakness, medication) and environmental hazards", "Staff negligence", "Equipment failure"], "correct_answer": 1, "explanation": "Falls result from a combination of patient risk factors (weakness, confusion, medications) and environmental hazards."}
            ]}
        ]
    },
    {
        "title": "Dementia & Alzheimer's Care",
        "description": "Understanding and caring for individuals with dementia and Alzheimer's disease. Learn about disease progression, communication strategies, behavioral management, daily care routines, and supporting families.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Teepa Snow", "instructor_avatar": "https://randomuser.me/api/portraits/women/79.jpg",
        "instructor_title": "Dementia Care Specialist",
        "thumbnail": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&q=80",
        "tags": ["Dementia", "Alzheimer's", "Healthcare", "Elder Care", "PSW"],
        "what_you_learn": ["Understand dementia stages and types", "Effective communication techniques", "Manage challenging behaviors with compassion", "Create safe and supportive environments"],
        "prerequisites": ["None"],
        "estimated_hours": 4, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Understanding Dementia - Full Training", "video_url": "https://www.youtube.com/watch?v=jjDCuMNaPHo", "duration": "35 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is dementia?", "options": ["A normal part of aging", "A group of symptoms affecting memory, thinking, and social abilities severely enough to interfere with daily life", "Just forgetfulness", "A mental illness"], "correct_answer": 1, "explanation": "Dementia is not a specific disease but a group of symptoms — Alzheimer's disease is the most common cause."},
                {"question": "What is the most common type of dementia?", "options": ["Vascular dementia", "Lewy body dementia", "Alzheimer's disease", "Frontotemporal dementia"], "correct_answer": 2, "explanation": "Alzheimer's disease accounts for 60-80% of dementia cases, affecting memory, thinking, and behavior progressively."},
                {"question": "What communication technique works best with dementia patients?", "options": ["Speak louder", "Use simple sentences, make eye contact, and allow extra response time", "Write everything down", "Use medical terminology"], "correct_answer": 1, "explanation": "Short simple sentences, eye contact, calm tone, and patience allow better communication with dementia patients."},
                {"question": "How should you respond to agitation in a dementia patient?", "options": ["Argue with them", "Stay calm, validate their feelings, redirect attention, check for unmet needs", "Restrain them", "Ignore the behavior"], "correct_answer": 1, "explanation": "Stay calm, validate emotions, look for underlying causes (pain, hunger), and gently redirect — never argue or confront."}
            ]},
            {"title": "Alzheimer's Care - Daily Routines & Activities", "video_url": "https://www.youtube.com/watch?v=LF8cAiAl4oc", "duration": "25 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "Why are routines important for people with dementia?", "options": ["They aren't important", "Routines provide structure, reduce confusion, and promote independence", "Only for staff convenience", "To save time"], "correct_answer": 1, "explanation": "Consistent routines reduce anxiety and confusion, help maintain abilities, and provide a sense of security."},
                {"question": "What is 'sundowning'?", "options": ["Falling asleep at sunset", "Increased confusion and agitation in the late afternoon/evening", "A treatment method", "Morning confusion"], "correct_answer": 1, "explanation": "Sundowning causes increased restlessness, confusion, and agitation as daylight fades — common in mid-stage dementia."}
            ]}
        ]
    },
    {
        "title": "Palliative & End-of-Life Care",
        "description": "Compassionate palliative care training. Learn pain management, emotional support, advance care planning, family communication, grief support, and providing dignity in end-of-life care.",
        "category": "Healthcare", "level": "intermediate", "is_premium": False, "price": 0,
        "instructor_name": "Hospice Foundation", "instructor_avatar": "https://randomuser.me/api/portraits/women/83.jpg",
        "instructor_title": "Palliative Care Educator",
        "thumbnail": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80",
        "tags": ["Palliative Care", "End of Life", "Healthcare", "Hospice", "Compassion"],
        "what_you_learn": ["Principles of palliative care", "Pain and symptom management", "Emotional and spiritual support", "Supporting families through grief"],
        "prerequisites": ["Basic healthcare knowledge"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Introduction to Palliative Care", "video_url": "https://www.youtube.com/watch?v=VT31eUrHNfk", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is palliative care?", "options": ["A cure for terminal illness", "Specialized care focused on comfort, quality of life, and symptom relief", "Only for cancer patients", "Emergency care"], "correct_answer": 1, "explanation": "Palliative care provides comfort and quality of life for patients with serious illness — it can complement curative treatment."},
                {"question": "When should palliative care begin?", "options": ["Only in the last days", "At any stage of serious illness, alongside curative treatment", "Only after all treatments fail", "Only in hospitals"], "correct_answer": 1, "explanation": "Palliative care can begin at diagnosis of any serious illness and continue alongside curative treatments."},
                {"question": "What is an advance care directive?", "options": ["A medical prescription", "A legal document expressing a person's healthcare wishes if they cannot communicate", "An insurance form", "A hospital admission form"], "correct_answer": 1, "explanation": "Advance directives document a person's wishes about medical treatment, ensuring their preferences are honored."}
            ]}
        ]
    },
    {
        "title": "Mental Health First Aid Awareness",
        "description": "Learn to recognize and respond to mental health crises. Covers depression, anxiety, psychosis, substance use, suicidal ideation, and how to provide initial support until professional help is available.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Mental Health Commission", "instructor_avatar": "https://randomuser.me/api/portraits/men/87.jpg",
        "instructor_title": "Mental Health Educator",
        "thumbnail": "https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=80",
        "tags": ["Mental Health", "First Aid", "Healthcare", "Awareness", "Crisis"],
        "what_you_learn": ["Recognize signs of mental health problems", "Respond to mental health crises", "Support someone experiencing anxiety or depression", "Know when and how to seek professional help"],
        "prerequisites": ["None"],
        "estimated_hours": 3, "status": "published", "pass_threshold": 70,
        "lessons": [
            {"title": "Mental Health First Aid - Full Training", "video_url": "https://www.youtube.com/watch?v=sZRFGFMhFNE", "duration": "30 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is mental health first aid?", "options": ["Diagnosing mental illness", "Initial help given to someone developing a mental health problem or crisis", "Prescribing medication", "Therapy sessions"], "correct_answer": 1, "explanation": "Mental health first aid is the initial support given until professional help is available — like physical first aid for the mind."},
                {"question": "What are common signs of depression?", "options": ["Always happy", "Persistent sadness, loss of interest, fatigue, changes in sleep/appetite", "Only crying", "Physical pain only"], "correct_answer": 1, "explanation": "Depression symptoms include persistent sadness, loss of interest, fatigue, sleep/appetite changes, difficulty concentrating."},
                {"question": "What should you do if someone mentions suicidal thoughts?", "options": ["Ignore it", "Take it seriously, listen without judgment, ask directly, help them connect with professional support", "Change the subject", "Tell them to cheer up"], "correct_answer": 1, "explanation": "Always take suicidal thoughts seriously. Listen, ask directly ('Are you thinking about suicide?'), stay with them, and help connect with crisis services."},
                {"question": "What is the ALGEE action plan in Mental Health First Aid?", "options": ["A medical procedure", "Approach, Listen, Give support, Encourage professional help, Encourage self-help", "A medication", "An assessment tool"], "correct_answer": 1, "explanation": "ALGEE: Approach/Assess, Listen non-judgmentally, Give support, Encourage professional help, Encourage self-help strategies."}
            ]}
        ]
    },
    {
        "title": "Vital Signs Measurement & Documentation",
        "description": "Learn to accurately measure, record, and interpret vital signs. Covers temperature, pulse, respiration, blood pressure, oxygen saturation, and proper documentation practices for healthcare workers.",
        "category": "Healthcare", "level": "beginner", "is_premium": False, "price": 0,
        "instructor_name": "Nurse Sarah", "instructor_avatar": "https://randomuser.me/api/portraits/women/44.jpg",
        "instructor_title": "Registered Nurse & Clinical Educator",
        "thumbnail": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80",
        "tags": ["Vital Signs", "Healthcare", "Nursing", "Documentation", "PSW"],
        "what_you_learn": ["Measure temperature, pulse, respiration, and blood pressure", "Use a pulse oximeter correctly", "Recognize abnormal vital sign values", "Document findings accurately"],
        "prerequisites": ["None"],
        "estimated_hours": 2, "status": "published", "pass_threshold": 75,
        "lessons": [
            {"title": "How to Take Vital Signs - Complete Guide", "video_url": "https://www.youtube.com/watch?v=7VBqzRD7Gbo", "duration": "25 min", "type": "video", "order": 0,
             "quiz": [
                {"question": "What is the normal adult resting heart rate?", "options": ["40-60 bpm", "60-100 bpm", "100-140 bpm", "120-160 bpm"], "correct_answer": 1, "explanation": "Normal adult resting heart rate is 60-100 beats per minute. Athletes may have lower rates (40-60)."},
                {"question": "What is the normal range for adult blood pressure?", "options": ["80/40 mmHg", "Less than 120/80 mmHg", "140/100 mmHg", "160/110 mmHg"], "correct_answer": 1, "explanation": "Normal blood pressure is less than 120/80 mmHg. Hypertension is 130/80 or higher."},
                {"question": "What is a normal blood oxygen saturation (SpO2)?", "options": ["80-85%", "85-90%", "95-100%", "100% always"], "correct_answer": 2, "explanation": "Normal SpO2 is 95-100%. Below 90% is considered critically low and requires immediate medical attention."},
                {"question": "What is the normal adult respiratory rate?", "options": ["5-10 breaths/min", "12-20 breaths/min", "25-30 breaths/min", "30-40 breaths/min"], "correct_answer": 1, "explanation": "Normal adult respiratory rate is 12-20 breaths per minute at rest."}
            ]},
            {"title": "Healthcare Documentation Best Practices", "video_url": "https://www.youtube.com/watch?v=5bVnPE0wvbw", "duration": "20 min", "type": "video", "order": 1,
             "quiz": [
                {"question": "What does the documentation principle 'If it wasn't documented, it wasn't done' mean?", "options": ["Documentation is optional", "Undocumented care is legally considered not performed", "Only document important things", "Verbal reports are sufficient"], "correct_answer": 1, "explanation": "In healthcare, documentation serves as legal proof that care was provided. Undocumented care is considered not done."},
                {"question": "What should you NEVER do when making a documentation error?", "options": ["Draw a single line through it", "Use white-out or completely obscure the original entry", "Initial the correction", "Add the date"], "correct_answer": 1, "explanation": "Never use white-out or obscure errors. Draw a single line, write 'error', initial, date, and write the correction."}
            ]}
        ]
    }
]

def seed():
    for course in COURSES:
        r = requests.post(f"{API_URL}/api/academy/admin/courses", headers=HEADERS, json=course)
        if r.status_code == 200:
            d = r.json()
            ls = course.get("lessons", [])
            qs = sum(len(l.get("quiz", [])) for l in ls)
            print(f"  {d.get('course',{}).get('title','?')[:50]:50} | {len(ls)} lessons | {qs} Qs")
        else:
            print(f"  FAIL: {course['title'][:45]} - {r.status_code}: {r.text[:80]}")

if __name__ == "__main__":
    print(f"Seeding {len(COURSES)} healthcare courses...")
    seed()
    print("Done!")
