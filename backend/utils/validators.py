import re

def validate_phone_number(phone: str, default_country_code: str = "60") -> str:
    """
    Validates and formats a phone number.
    Defaults to Malaysia (+60) if no country code is detected.
    Removes non-digit characters (except leading +).
    """
    if not phone:
        return ""
    
    # Remove all non-digit characters except leading +
    clean_phone = re.sub(r'[^0-9+]', '', phone)
    
    # If empty after cleaning
    if not clean_phone:
        return ""
        
    # Check if it starts with +
    if clean_phone.startswith("+"):
        # Ensure it has enough digits (simple check)
        if len(clean_phone) < 8: 
             return clean_phone # Return as is if too short, let API handle or fail
        return clean_phone
        
    # If it starts with 60 (Malaysia) but no +, add +
    if clean_phone.startswith("60"):
        return f"+{clean_phone}"
        
    # If it starts with 0 (e.g. 016...), replace 0 with +60
    if clean_phone.startswith("0"):
        return f"+{default_country_code}{clean_phone[1:]}"
        
    # Otherwise, assume it's a raw number without country code, prepend default
    return f"+{default_country_code}{clean_phone}"
