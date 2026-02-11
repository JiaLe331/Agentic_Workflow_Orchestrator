
import os

def setup_credentials():
    print("=" * 60)
    print("🔧 n8n Credential Configuration Setup")
    print("=" * 60)
    print("This script will help you set the default Supabase Credential ID for your generated workflows.")
    print("This fixes the 'Credential does not exist' error by ensuring the correct account is used.")
    print("-" * 60)
    
    print("\n👉 Please retrieve your Credential ID from n8n:")
    print("   1. Open n8n: http://localhost:5678")
    print("   2. Go to 'Credentials'.")
    print("   3. Click on the credential you want to use (e.g., 'Supabase account 3').")
    print("   4. Look at the URL: http://localhost:5678/credential/<ID>")
    print("   5. Copy that ID (it might be a number like '12' or '2' or a string).")
    
    cred_id = input("\n📝 Enter your Supabase Credential ID: ").strip()
    
    if not cred_id:
        print("❌ Authorization aborted. No ID provided.")
        return

    env_path = ".env"
    new_lines = []
    found = False
    
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            lines = f.readlines()
            for line in lines:
                if line.startswith("SUPABASE_CREDENTIAL_ID="):
                    new_lines.append(f"SUPABASE_CREDENTIAL_ID={cred_id}\n")
                    found = True
                else:
                    new_lines.append(line)
    
    if not found:
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines.append("\n")
        new_lines.append(f"SUPABASE_CREDENTIAL_ID={cred_id}\n")
        
    with open(env_path, "w") as f:
        f.writelines(new_lines)
        
    print(f"\n✅ Success! Saved SUPABASE_CREDENTIAL_ID={cred_id} to .env")
    print("🚀 You can now run 'python3 main.py ...' and it will use this credential!")

if __name__ == "__main__":
    setup_credentials()
