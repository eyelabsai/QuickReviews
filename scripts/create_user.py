import argparse
import os
import sys
import json
import string
import secrets

import firebase_admin
from firebase_admin import credentials, auth, firestore


def generate_temp_password(length: int = 8) -> str:
    # Use only letters and numbers, no special characters
    alphabet = string.ascii_letters + string.digits
    # Ensure at least one letter and one number
    password = []
    password.append(secrets.choice(string.ascii_lowercase))  # One lowercase letter
    password.append(secrets.choice(string.digits))           # One number
    # Fill the rest randomly
    for _ in range(length - 2):
        password.append(secrets.choice(alphabet))
    # Shuffle the password
    password_list = list(password)
    secrets.SystemRandom().shuffle(password_list)
    return ''.join(password_list)


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or update a Firebase Auth user and Firestore profile.")
    parser.add_argument("--email", required=True, help="User email")
    parser.add_argument("--full-name", dest="full_name", default="", help="Full name to store in profile")
    parser.add_argument("--review-link", dest="review_link", default="", help="Review link to store in profile")
    parser.add_argument("--temp-password", dest="temp_password", default=None, help="Optional temporary password to set (random if omitted)")
    parser.add_argument("--service-account", dest="service_account", default=os.path.join(os.path.dirname(os.path.dirname(__file__)), "serviceAccountKey.json"), help="Path to service account JSON (default: project root serviceAccountKey.json)")
    args = parser.parse_args()

    if not os.path.exists(args.service_account):
        print(f"Missing service account JSON at: {args.service_account}", file=sys.stderr)
        sys.exit(1)

    cred = credentials.Certificate(args.service_account)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    email = args.email.strip().lower()
    temp_password = args.temp_password or generate_temp_password()
    full_name = args.full_name.strip()
    review_link = args.review_link.strip()

    created = False
    try:
        user = auth.get_user_by_email(email)
        # Reset password to the temporary one
        user = auth.update_user(user.uid, password=temp_password)
        print(f"User exists. Password reset. uid={user.uid}")
    except auth.UserNotFoundError:
        user = auth.create_user(email=email, password=temp_password, email_verified=True)
        created = True
        print(f"Created user. uid={user.uid}")

    db = firestore.client()
    qs = db.collection("users").where("email", "==", email).limit(1).get()
    doc_ref = qs[0].reference if qs else db.collection("users").document(user.uid)

    profile_updates = {"email": email, "needsPasswordChange": True}
    if full_name:
        profile_updates["fullName"] = full_name
    if review_link:
        profile_updates["reviewLink"] = review_link

    doc_ref.set(profile_updates, merge=True)
    print(f"Profile upserted at: {doc_ref.path}")

    # Provide a password reset link admins can send to the user
    try:
        reset_link = auth.generate_password_reset_link(email)
        print("Password reset link (optional to send to user):")
        print(reset_link)
    except Exception as e:
        print(f"Could not generate password reset link: {e}")

    print("\nTemporary password (share securely with the user):")
    print(temp_password)
    print("\nOn first login, user will be prompted to change their password and then complete profile.")


if __name__ == "__main__":
    main()


