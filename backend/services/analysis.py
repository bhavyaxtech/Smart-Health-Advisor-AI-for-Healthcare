from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_text(value: Optional[str]) -> str:
    return (value or "").strip()


def normalize_symptom_key(symptom: str) -> str:
    return normalize_text(symptom).lower()


def severity_label_to_score(severity_label: str) -> int:
    mapping = {
        "mild": 2,
        "moderate": 5,
        "severe": 8,
        "very severe": 10,
    }
    return mapping.get(normalize_text(severity_label).lower(), 0)


def build_user_context(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "age": payload.get("age"),
        "gender": normalize_text(payload.get("gender")),
        "medical_history": normalize_text(payload.get("medical_history")),
        "duration": normalize_text(payload.get("duration")),
        "severity": normalize_text(payload.get("severity")),
        "additional_info": normalize_text(payload.get("additional_info")),
    }


def ai_enhanced_dietary_recommendations(
    symptom: str, user_context: Dict[str, Any]
) -> Dict[str, List[str]]:
    symptom_lower = normalize_symptom_key(symptom)
    age = user_context.get("age") or 30
    gender = normalize_text(user_context.get("gender")).lower()

    dietary_db: Dict[str, Dict[str, List[str]]] = {
        "headache": {
            "consume": [
                "Water (8-10 glasses daily)",
                "Magnesium-rich foods (almonds, spinach)",
                "Omega-3 fatty acids (salmon, walnuts)",
                "Ginger tea",
                "Peppermint tea",
                "Complex carbohydrates (quinoa, brown rice)",
                "Riboflavin foods (eggs, dairy)",
                "Coenzyme Q10 sources (whole grains, fish)",
            ],
            "avoid": [
                "Aged cheeses",
                "Processed meats",
                "Alcohol",
                "Excessive caffeine",
                "Artificial sweeteners",
                "MSG-heavy foods",
            ],
            "focus": [
                "Maintain stable blood sugar",
                "Stay hydrated",
                "Regular meal timing",
                "Anti-inflammatory nutrients",
            ],
            "meals": [
                "Breakfast: Steel-cut oats with almonds and blueberries",
                "Lunch: Quinoa bowl with spinach and salmon",
                "Dinner: Grilled chicken with sweet potato and broccoli",
                "Snack: Walnuts with herbal tea",
            ],
            "supplements": [
                "Magnesium glycinate",
                "Riboflavin",
                "Omega-3",
            ],
        },
        "nausea": {
            "consume": [
                "Ginger tea",
                "Plain crackers",
                "Bananas",
                "Plain rice",
                "Toast",
                "Electrolyte fluids",
                "Small frequent meals",
            ],
            "avoid": [
                "Spicy foods",
                "Greasy foods",
                "Large meals",
                "Acidic foods",
                "Carbonated beverages",
            ],
            "focus": [
                "Hydration maintenance",
                "Gentle foods",
                "Gradual food reintroduction",
                "Digestive rest",
            ],
            "meals": [
                "Phase 1: Ginger tea with crackers",
                "Phase 2: Rice with banana",
                "Phase 3: Mild broth with toast",
            ],
            "supplements": [
                "Vitamin B6",
                "Ginger capsules",
                "Probiotics after acute phase",
            ],
        },
        "fatigue": {
            "consume": [
                "Iron-rich foods",
                "Vitamin B12 sources",
                "Complex carbohydrates",
                "Protein at each meal",
                "Vitamin D sources",
                "Magnesium foods",
            ],
            "avoid": [
                "Refined sugars",
                "Highly processed foods",
                "Alcohol excess",
                "Large heavy meals",
            ],
            "focus": [
                "Stable blood sugar levels",
                "Adequate protein intake",
                "Nutrient density",
                "Sleep support",
            ],
            "meals": [
                "Breakfast: Greek yogurt with berries and chia seeds",
                "Lunch: Lentil soup with whole grain bread",
                "Dinner: Salmon with quinoa and vegetables",
                "Snack: Apple with almond butter",
            ],
            "supplements": [
                "Vitamin B-complex",
                "Vitamin D3",
                "Iron if clinically deficient",
            ],
        },
        "anxiety": {
            "consume": [
                "Omega-3 rich fish",
                "Magnesium foods",
                "Complex carbohydrates",
                "Herbal teas",
                "Probiotic foods",
                "Zinc-rich foods",
            ],
            "avoid": [
                "Excess caffeine",
                "Alcohol",
                "Refined sugars",
                "Energy drinks",
                "Highly processed foods",
            ],
            "focus": [
                "Stable blood sugar",
                "Gut-brain axis support",
                "Calming nutrients",
                "Hydration",
            ],
            "meals": [
                "Breakfast: Oatmeal with walnuts and berries",
                "Lunch: Salmon salad with leafy greens",
                "Dinner: Turkey with sweet potato and broccoli",
                "Evening: Chamomile tea",
            ],
            "supplements": [
                "Magnesium glycinate",
                "Omega-3",
                "L-theanine",
            ],
        },
        "insomnia": {
            "consume": [
                "Tryptophan foods",
                "Magnesium-rich foods",
                "Tart cherry juice",
                "Chamomile tea",
                "Complex carbohydrates",
            ],
            "avoid": [
                "Caffeine after midday",
                "Heavy late meals",
                "Alcohol",
                "High-sugar foods",
            ],
            "focus": [
                "Sleep-supportive nutrients",
                "Evening meal timing",
                "Circadian rhythm support",
            ],
            "meals": [
                "Dinner: Chicken with quinoa several hours before bed",
                "Evening snack: Banana with almond butter",
                "Bedtime: Chamomile tea",
            ],
            "supplements": [
                "Magnesium glycinate",
                "Melatonin if appropriate",
                "L-theanine",
            ],
        },
    }

    default = {
        "consume": [
            "Whole foods",
            "Fresh fruits and vegetables",
            "Lean proteins",
            "Whole grains",
            "Adequate water intake",
            "Probiotic foods",
        ],
        "avoid": [
            "Highly processed foods",
            "Excess sugar",
            "Trans fats",
            "Excess alcohol",
        ],
        "focus": [
            "Balanced nutrition",
            "Regular meal timing",
            "Portion control",
            "Nutrient density",
        ],
        "meals": [
            "Include protein at each meal",
            "Build meals around vegetables and whole grains",
            "Stay hydrated throughout the day",
        ],
        "supplements": [
            "General multivitamin if clinically appropriate",
            "Vitamin D if deficient",
            "Omega-3",
        ],
    }

    selected = None
    for key, value in dietary_db.items():
        if key in symptom_lower:
            selected = {
                "consume": list(value["consume"]),
                "avoid": list(value["avoid"]),
                "focus": list(value["focus"]),
                "meals": list(value["meals"]),
                "supplements": list(value["supplements"]),
            }
            break

    if selected is None:
        selected = {
            "consume": list(default["consume"]),
            "avoid": list(default["avoid"]),
            "focus": list(default["focus"]),
            "meals": list(default["meals"]),
            "supplements": list(default["supplements"]),
        }

    if age and age > 50:
        selected["consume"].append("Calcium-rich foods for long-term bone support")
        selected["supplements"].append(
            "Vitamin D3 if appropriate for your clinician guidance"
        )

    if gender == "female":
        selected["consume"].append(
            "Iron-rich foods when appropriate for your health history"
        )

    return selected


def ai_enhanced_cause_analysis(
    symptom: str, user_context: Dict[str, Any]
) -> List[Dict[str, str]]:
    symptom_lower = normalize_symptom_key(symptom)
    age = user_context.get("age") or 30

    causes_db: Dict[str, List[Dict[str, str]]] = {
        "headache": [
            {
                "condition": "Tension Headache",
                "probability": "High (40-50%)",
                "description": "Often linked to stress, posture, and muscle tension.",
                "urgency": "Low",
                "confidence": "High (95%)",
            },
            {
                "condition": "Dehydration",
                "probability": "High (30-40%)",
                "description": "Low fluid intake or electrolyte imbalance may contribute.",
                "urgency": "Low",
                "confidence": "High (90%)",
            },
            {
                "condition": "Migraine",
                "probability": "Medium (20-30%)",
                "description": "May involve triggers, nausea, light sensitivity, or throbbing pain.",
                "urgency": "Medium",
                "confidence": "Medium (75%)",
            },
            {
                "condition": "Hypertension",
                "probability": "Low (5-10%)" if age < 40 else "Medium (15-20%)",
                "description": "Blood pressure issues can sometimes contribute to headaches.",
                "urgency": "High",
                "confidence": "Medium (80%)",
            },
        ],
        "anxiety": [
            {
                "condition": "Stress Response",
                "probability": "High (30-40%)",
                "description": "Life stressors may trigger anxious thoughts and physical symptoms.",
                "urgency": "Low",
                "confidence": "High (95%)",
            },
            {
                "condition": "Generalized Anxiety",
                "probability": "High (35-45%)",
                "description": "Persistent worry across multiple areas of life.",
                "urgency": "Medium",
                "confidence": "High (90%)",
            },
            {
                "condition": "Caffeine-Related Symptoms",
                "probability": "Medium (20-25%)",
                "description": "Excess caffeine may worsen nervousness or palpitations.",
                "urgency": "Low",
                "confidence": "High (85%)",
            },
        ],
    }

    default_causes = [
        {
            "condition": "Lifestyle Factors",
            "probability": "High (40-50%)",
            "description": "Diet, sleep, hydration, stress, or activity patterns may contribute.",
            "urgency": "Low",
            "confidence": "High (90%)",
        },
        {
            "condition": "Mild Infection or Recovery State",
            "probability": "Medium (20-30%)",
            "description": "Recent illness or general inflammation may influence symptoms.",
            "urgency": "Low",
            "confidence": "Medium (70%)",
        },
        {
            "condition": "Medication or Supplement Effects",
            "probability": "Medium (15-25%)",
            "description": "Some medicines and supplements can affect symptoms.",
            "urgency": "Medium",
            "confidence": "Medium (75%)",
        },
    ]

    for key, value in causes_db.items():
        if key in symptom_lower:
            return value

    return default_causes


def generate_ai_insights(
    symptom: str, user_context: Dict[str, Any]
) -> List[Dict[str, str]]:
    insights: List[Dict[str, str]] = [
        {
            "insight_type": "Pattern Analysis",
            "title": "Pattern Recognition Insight",
            "description": f"{symptom.title()} can be influenced by sleep, "
            "stress, hydration, and meal timing patterns.",
            "recommendation": "Track symptom timing alongside sleep, stress, "
            "hydration, and meals for 1-2 weeks.",
            "evidence_level": "Moderate confidence from symptom pattern heuristics",
        },
        {
            "insight_type": "Prevention",
            "title": "Preventive Lifestyle Strategy",
            "description": "Consistent routines often reduce recurrence and make triggers easier to identify.",
            "recommendation": "Aim for regular meals, hydration, and "
            "consistent sleep before making multiple changes at once.",
            "evidence_level": "Strong general lifestyle support evidence",
        },
    ]

    if (user_context.get("age") or 0) > 40:
        insights.append(
            {
                "insight_type": "Age-Related",
                "title": "Age-Specific Considerations",
                "description": "Persistent symptoms in older age groups may warrant a broader review with a clinician.",
                "recommendation": "Discuss persistent or worsening symptoms with a healthcare professional.",
                "evidence_level": "General age-related clinical caution",
            }
        )

    return insights


def ai_risk_assessment(symptom: str, severity: str, duration: str) -> Dict[str, Any]:
    del symptom

    risk_factors: Dict[str, Any] = {
        "immediate_risk": "Low",
        "progression_risk": "Low",
        "intervention_urgency": "Routine",
        "follow_up_timeline": "1-2 weeks",
        "ai_recommendation": "Monitor symptoms and implement conservative lifestyle adjustments.",
    }

    severity_value = normalize_text(severity).lower()
    duration_value = normalize_text(duration).lower()

    if severity_value in {"severe", "very severe"}:
        risk_factors["immediate_risk"] = "Medium"
        risk_factors["intervention_urgency"] = "Prompt (within 24-48 hours)"
        risk_factors["follow_up_timeline"] = "2-5 days"
        risk_factors["ai_recommendation"] = (
            "Seek professional evaluation sooner due to symptom intensity."
        )

    if "week" in duration_value or "month" in duration_value:
        risk_factors["progression_risk"] = "Medium"
        risk_factors["ai_recommendation"] = (
            "Persistent symptoms deserve clinician review if they are not improving."
        )

    return risk_factors


def build_lifestyle_suggestions(symptom: str) -> List[str]:
    symptom_key = normalize_symptom_key(symptom)

    common = [
        "Maintain consistent hydration throughout the day.",
        "Prioritize 7-9 hours of quality sleep.",
        "Use a symptom diary to track timing, severity, and potential triggers.",
        "Aim for regular, balanced meals rather than skipping food.",
        "Reduce high-processed food intake where possible.",
    ]

    if "headache" in symptom_key:
        return common + [
            "Review caffeine intake for sudden increases or withdrawal.",
            "Limit prolonged screen time and prioritize posture breaks.",
        ]
    if "fatigue" in symptom_key:
        return common + [
            "Pace your activity and avoid overexertion while symptoms persist.",
            "Review sleep consistency and discuss deficiency testing if symptoms continue.",
        ]
    if "anxiety" in symptom_key:
        return common + [
            "Practice slow breathing or mindfulness exercises daily.",
            "Limit caffeine and energy drinks if they worsen symptoms.",
        ]

    return common


def build_red_flags(symptom: str) -> List[str]:
    symptom_key = normalize_symptom_key(symptom)

    flags = [
        "Sudden severe or rapidly worsening symptoms.",
        "Symptoms with confusion, fainting, or severe weakness.",
        "Symptoms affecting breathing, chest pain, or severe dehydration.",
        "Persistent symptoms not improving as expected.",
    ]

    if "headache" in symptom_key:
        flags.extend(
            [
                "A sudden worst-ever headache.",
                "Headache with new neurological changes, vision changes, or confusion.",
            ]
        )

    return flags


def build_symptom_analysis_text(symptom: str, request_data: Dict[str, Any]) -> str:
    duration = normalize_text(request_data.get("duration")) or "Not specified"
    severity = normalize_text(request_data.get("severity")) or "Not specified"
    age = request_data.get("age")
    gender = normalize_text(request_data.get("gender"))
    additional_info = normalize_text(request_data.get("additional_info"))
    medical_history = normalize_text(request_data.get("medical_history"))

    personal_bits = []
    if age:
        personal_bits.append(f"Age {age}")
    if gender:
        personal_bits.append(gender)
    if medical_history:
        personal_bits.append("medical history provided")

    personal_context = (
        ", ".join(personal_bits)
        if personal_bits
        else "No extra personal context provided"
    )

    summary_parts = [
        f"Symptom reviewed: {symptom.title()}",
        f"Duration: {duration}",
        f"Severity: {severity}",
        f"Personal context: {personal_context}",
    ]

    if additional_info:
        summary_parts.append(f"Additional context: {additional_info}")

    summary_parts.extend(
        [
            "",
            "This educational analysis uses structured symptom rules, nutrition guidance, and safety heuristics.",
            "It is designed to help you organize next steps, not replace professional medical assessment.",
        ]
    )

    return "\n".join(summary_parts)


def build_medical_disclaimer() -> str:
    return (
        "This health guidance is educational only and is not medical diagnosis or treatment. "
        "Always consult a qualified healthcare professional for persistent, severe, unusual, "
        "or worsening symptoms. Seek urgent care immediately if red-flag symptoms are present."
    )


def build_personalized_tips(
    request_data: Dict[str, Any],
    dietary_info: Dict[str, List[str]],
    possible_causes: List[Dict[str, str]],
) -> List[str]:
    severity = normalize_text(request_data.get("severity")) or "reported"
    duration = normalize_text(request_data.get("duration")) or "reported"
    primary_focus = dietary_info.get("focus", ["gentle supportive care"])[0]
    lead_cause = (
        possible_causes[0]["condition"]
        if possible_causes
        else "lifestyle-related factors"
    )

    return [
        f"Based on your {severity} severity, focus first on: {primary_focus}.",
        f"Given the {duration} duration, watch for either clear improvement "
        "or any worsening trend over the next several days.",
        f"Your symptom pattern may align most closely with: {lead_cause}.",
        "Track meals, hydration, sleep, and symptom timing to make follow-up assessment more useful.",
    ]


def build_analysis_response(
    request_data: Dict[str, Any],
    research_text: str,
) -> Dict[str, Any]:
    symptom = normalize_text(request_data.get("symptom"))
    user_context = build_user_context(request_data)

    dietary_info = ai_enhanced_dietary_recommendations(symptom, user_context)
    possible_causes = ai_enhanced_cause_analysis(symptom, user_context)
    ai_insights = generate_ai_insights(symptom, user_context)
    risk_assessment = ai_risk_assessment(
        symptom=symptom,
        severity=normalize_text(request_data.get("severity")),
        duration=normalize_text(request_data.get("duration")),
    )

    return {
        "symptom_analysis": build_symptom_analysis_text(symptom, request_data),
        "ai_web_research": research_text,
        "diet_plan": {
            "foods_to_consume": dietary_info["consume"],
            "foods_to_avoid": dietary_info["avoid"],
            "nutritional_focus": dietary_info["focus"],
            "meal_suggestions": dietary_info["meals"],
            "supplements": dietary_info["supplements"],
        },
        "possible_causes": [
            {
                "condition": cause["condition"],
                "probability": cause["probability"],
                "description": cause["description"],
                "urgency_level": cause["urgency"],
                "ai_confidence": cause["confidence"],
            }
            for cause in possible_causes
        ],
        "lifestyle_suggestions": build_lifestyle_suggestions(symptom),
        "red_flags": build_red_flags(symptom),
        "ai_insights": ai_insights,
        "risk_assessment": risk_assessment,
        "personalized_tips": build_personalized_tips(
            request_data, dietary_info, possible_causes
        ),
        "medical_disclaimer": build_medical_disclaimer(),
        "search_timestamp": utc_now_iso(),
    }


def build_chat_response(
    message: str, recent_records: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    message_lower = normalize_text(message).lower()
    recent_records = recent_records or []
    last_symptom = recent_records[0].get("symptom") if recent_records else None

    context_line = (
        f"Your most recent logged symptom was {last_symptom}."
        if last_symptom
        else "You do not have recent symptom history logged yet."
    )

    if any(word in message_lower for word in ["pain", "hurt", "ache", "sore"]):
        response = (
            f"{context_line}\n\n"
            "Pain can come from many causes, so location, duration, and associated symptoms matter. "
            "Conservative next steps often include hydration, rest, meal regularity, and noting what worsens the pain."
        )
        suggestions = [
            "Help me analyze this pain",
            "What foods may support pain recovery?",
            "What red flags should I watch for?",
        ]
        follow_ups = [
            "Where is the pain located?",
            "How severe is it?",
            "What makes it better or worse?",
        ]
    elif any(
        word in message_lower for word in ["fatigue", "tired", "energy", "exhausted"]
    ):
        response = (
            f"{context_line}\n\n"
            "Fatigue is often influenced by sleep, hydration, recent illness, stress, nutrition, and activity balance. "
            "Persistent or unexplained fatigue deserves clinical review."
        )
        suggestions = [
            "Analyze fatigue",
            "Show energy-supportive foods",
            "What should I track with fatigue?",
        ]
        follow_ups = [
            "How long have you felt fatigued?",
            "Are you sleeping enough?",
            "Do meals affect your energy?",
        ]
    else:
        response = (
            f"{context_line}\n\n"
            "I can help you organize symptoms, nutrition guidance, safety warnings, and next-step questions."
        )
        suggestions = [
            "Analyze a symptom",
            "Review my symptom history",
            "Show my dashboard",
        ]
        follow_ups = [
            "What symptom would you like to review?",
            "How long has it been happening?",
            "How severe is it?",
        ]

    return {
        "response": response,
        "suggestions": suggestions,
        "follow_up_questions": follow_ups,
        "ai_confidence": "Moderate",
    }


def build_voice_response(audio_text: str, confidence: float) -> Dict[str, Any]:
    text = normalize_text(audio_text).lower()
    symptom_keywords = {
        "headache": ["headache", "migraine", "head pain"],
        "stomach": ["stomach ache", "nausea", "stomach pain", "belly pain"],
        "fatigue": ["tired", "exhausted", "fatigue", "low energy"],
        "anxiety": ["anxious", "worried", "stress", "nervous"],
        "pain": ["pain", "hurt", "ache", "sore"],
    }

    detected_symptoms: List[str] = []
    for category, keywords in symptom_keywords.items():
        if any(keyword in text for keyword in keywords):
            detected_symptoms.append(category)

    if confidence > 0.8:
        confidence_level = "High"
    elif confidence > 0.5:
        confidence_level = "Medium"
    else:
        confidence_level = "Low"

    if detected_symptoms:
        response = (
            f"Detected possible symptom categories: {', '.join(detected_symptoms)}. "
            "You can now run a full symptom analysis using the transcript."
        )
    else:
        response = (
            "No specific symptom category was confidently detected. "
            "Try describing the symptom, how long it has been happening, and how severe it feels."
        )

    return {
        "status": "success",
        "response": response,
        "detected_symptoms": detected_symptoms,
        "confidence": confidence_level,
        "suggestions": [
            "Use detailed symptom analysis",
            "Ask a follow-up health question",
            "Review your recent history",
        ],
    }
