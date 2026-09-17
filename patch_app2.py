import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add isChatbotOpen state
if "const [isChatbotOpen, setIsChatbotOpen]" not in content:
    content = content.replace(
        "const [toastMessage, setToastMessage] = useState<string | null>(null);",
        "const [toastMessage, setToastMessage] = useState<string | null>(null);\n  const [isChatbotOpen, setIsChatbotOpen] = useState(false);"
    )

# Add onToggle prop to Chatbot
if "onToggle={setIsChatbotOpen}" not in content:
    content = content.replace(
        "<Chatbot \n        lang={lang} \n        currentUser={currentUser} ",
        "<Chatbot \n        lang={lang} \n        currentUser={currentUser} \n        onToggle={setIsChatbotOpen}"
    )

# Hide Floating Social Bar
social_bar = 'className="fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-2"'
social_bar_new = 'className={`fixed left-3 sm:left-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 p-2 transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}'
content = content.replace(social_bar, social_bar_new)

# Note: The user said "3 nút này" which probably refers to the Floating Social Bar.
# But they also want "tắt khung chatbot thì hiện lại bên phải bình thường".
# Wait, they want it to appear on the *RIGHT* normally?
# Oh! The image shows it was on the right. And then I moved it to the left.
# "tắt khung chatbot thì hiện lại bên phải bình thường" -> So they want it on the right, but hidden when chatbot is open.
# Ah! Let me change it back to the right!
content = content.replace(social_bar_new, social_bar_new.replace("left-3 sm:left-4", "right-0"))
content = content.replace(social_bar, social_bar_new.replace("left-3 sm:left-4", "right-0")) # just in case

# Wait, if they wanted it on the right normally, let me just replace "left-3 sm:left-4" with "right-0" everywhere in the social bar class
content = content.replace('className={`fixed left-3 sm:left-4 top-1/2', 'className={`fixed right-0 top-1/2')

# But wait, what about the FAB? (Đăng ký tập thử)
# Should it be hidden too? Chatbot takes up a lot of screen on mobile.
# Maybe I should hide the FAB too when chatbot is open.
fab_class = 'className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[300px]"'
fab_class_new = 'className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-[300px] transition-opacity duration-300 ${isChatbotOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}'
content = content.replace(fab_class, fab_class_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
