with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()

# I will find `<iframe` and carefully replace everything after it with proper tags.
idx = content.find('<iframe')
if idx != -1:
    end_idx = content.find('/>', idx)
    if end_idx != -1:
        proper_end = """                />
              </div>
            </div>
          </div>
        </div>
        </FadeIn>
      </section>
    </div>
  );
};"""
        new_content = content[:end_idx] + proper_end
        with open('src/pages/ContactPage.tsx', 'w') as f:
            f.write(new_content)
