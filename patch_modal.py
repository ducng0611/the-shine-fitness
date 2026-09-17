import re

with open('src/components/RegistrationModal.tsx', 'r') as f:
    content = f.read()

# Add prop
content = content.replace(
    "lang: 'vi' | 'en';", 
    "lang: 'vi' | 'en';\n  onSuccessSubmit?: (msg: string) => void;"
)

content = content.replace(
    "export function RegistrationModal({ isOpen, onClose, defaultPackage, lang }: RegistrationModalProps) {",
    "export function RegistrationModal({ isOpen, onClose, defaultPackage, lang, onSuccessSubmit }: RegistrationModalProps) {"
)

# Trigger it on success
success_block = """
      await saveRegistrationToFirebase(regRecord);
      
      if (onSuccessSubmit) {
        onSuccessSubmit(lang === 'vi' 
          ? 'Yêu cầu của bạn đã được gửi thành công. Nhân viên của chúng tôi sẽ sớm liên hệ!' 
          : 'Your booking request was received successfully. A staff member will contact you soon.');
      }
      
      setSuccessData(regRecord);
"""
if "onSuccessSubmit(" not in content:
    content = content.replace(
        "await saveRegistrationToFirebase(regRecord);\n      setSuccessData(regRecord);", 
        success_block
    )

with open('src/components/RegistrationModal.tsx', 'w') as f:
    f.write(content)
