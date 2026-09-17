with open('src/pages/ContactPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("              </div>    </div>  );};", "              </div></div></div></FadeIn></section></div>);};")
content = content.replace("              </div>\n    </div>\n  );\n};", "              </div>\n            </div>\n          </div>\n        </FadeIn>\n      </section>\n    </div>\n  );\n};")

with open('src/pages/ContactPage.tsx', 'w') as f:
    f.write(content)
