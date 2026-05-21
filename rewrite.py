import re
import sys

file_path = r"c:\Users\Big Duck\Nueva carpeta\app\(jardinero)\hoy\page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Colors & Borders
content = content.replace("bg-[#10161d]", "bg-[#2a2928]")
content = content.replace("border-[#1e293b]", "border-[#3a3938]")
content = content.replace("bg-[#1e293b]", "bg-[#3a3938]")
content = content.replace("bg-[#090d10]", "bg-[#1a1918]")
content = content.replace("text-emerald-500", "text-[#849d85]")
content = content.replace("bg-emerald-500", "bg-[#849d85]")
content = content.replace("border-emerald-500", "border-[#849d85]")
content = content.replace("emerald-500", "[#849d85]")

content = content.replace("rounded-xl", "rounded-3xl")
content = content.replace("rounded-lg", "rounded-2xl")

# 2. Confetti component removal
confetti_pattern = re.compile(r"// ─── Confetti component ───.*?// ─── Stepper button ───", re.DOTALL)
content = confetti_pattern.sub("// ─── Stepper button ───", content)
content = content.replace("<ConfettiOverlay />", "")

# 3. StepBtn replacement
stepbtn_old = 'className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-[#3a3938] hover:bg-[#849d85]/20 text-foreground font-bold text-base flex items-center justify-center transition-colors"'
stepbtn_new = 'className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-2xl bg-[#3a3938] text-[#e0e0e0] font-bold text-base flex items-center justify-center transition-colors hover:bg-[#849d85] hover:text-[#2a2928]"'
content = content.replace(stepbtn_old, stepbtn_new)

# 4. Progress Ring
content = content.replace('viewBox="0 0 80 80"\n                  width="80"\n                  height="80"', 'viewBox="0 0 100 100"\n                  width="100"\n                  height="100"')
content = content.replace('cx="40"\n                    cy="40"\n                    r={radius}\n                    stroke="#3a3938"\n                    strokeWidth="7"', 'cx="50"\n                    cy="50"\n                    r={40}\n                    stroke="#3a3938"\n                    strokeWidth="10"')
content = content.replace('cx="40"\n                    cy="40"\n                    r={radius}\n                    stroke="#849d85"\n                    strokeWidth="7"', 'cx="50"\n                    cy="50"\n                    r={40}\n                    stroke="#849d85"\n                    strokeWidth="10"')
content = content.replace('const radius = 32;', 'const radius = 40;')
content = content.replace('<span className="text-[18px] font-bold leading-none text-foreground">', '<span className="text-3xl font-serif text-[#e0e0e0] font-medium tracking-tight">')

# 5. Celebration Card
celeb_pattern = re.compile(r"\{\s*selectedStatus\.porcentaje === 100 \? \(\s*<div className=\"relative bg-gradient.*?\)\s*:\s*\(", re.DOTALL)
celeb_new = """{selectedStatus.porcentaje === 100 ? (
              <div className="flex flex-col items-center justify-center bg-[#2a2928] border border-[#3a3938] p-8 rounded-3xl text-center space-y-4 shadow-none min-h-[180px] animate-in fade-in duration-1000">
                <CheckCircle2 className="w-12 h-12 text-[#849d85] mb-2" strokeWidth={1.5} />
                <h3 className="font-serif text-3xl text-[#e0e0e0]">
                  Día completado
                </h3>
                <p className="text-sm text-[#e0e0e0]/70 font-sans">
                  Todas las tareas en {selectedStatus.ubicacion} están listas.
                </p>
              </div>
            ) : ("""
content = celeb_pattern.sub(celeb_new, content)

# 6. Carpa cards style (Flat matte #2a2928 surface, subtle #3a3938 borders, no box-shadows)
card_old = "'bg-gradient-to-b from-[#111921] to-[#0c1218] border-[#849d85]/40 shadow-lg shadow-[#849d85]/5 ring-1 ring-[#849d85]/20'"
card_new = "'bg-[#2a2928] border-[#849d85] shadow-none'"
content = content.replace(card_old, card_new)

card_old_2 = "'bg-[#2a2928] border-[#3a3938] hover:border-[#849d85]/20 hover:bg-[#131b24]'"
card_new_2 = "'bg-[#2a2928] border-[#3a3938] hover:border-[#849d85]/50'"
content = content.replace(card_old_2, card_new_2)

content = content.replace('<div className="absolute top-0 right-0 w-20 h-20 bg-[#849d85]/5 rounded-full blur-2xl -mr-6 -mt-6" />', '')

# 7. Checklist Checkbox
check_old = r'''<button
                        type="button"
                        onClick={() => toggleTarea(index)}
                        className="ml-auto min-w-[44px] min-h-[44px] flex items-center justify-center transition-transform hover:scale-110 focus:outline-none"
                      >
                        {acc.hecha ? (
                          <CheckCircle2 className="w-6 h-6 text-[#849d85] fill-[#849d85]/10" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground hover:text-[#849d85]" />
                        )}
                      </button>'''

check_new = '''<button
                        type="button"
                        onClick={() => toggleTarea(index)}
                        className="ml-auto min-w-[48px] min-h-[48px] flex items-center justify-center focus:outline-none"
                      >
                        {acc.hecha ? (
                          <div className="w-8 h-8 rounded-full bg-[#849d85] flex items-center justify-center transition-all">
                            <CheckCircle2 className="w-5 h-5 text-[#2a2928]" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full border-2 border-[#3a3938] bg-[#2a2928] flex items-center justify-center hover:border-[#849d85]/50 transition-all" />
                        )}
                      </button>'''
content = content.replace(check_old, check_new)

# 8. Checklist Task title (Large readable Inter)
content = content.replace('<h3\n                            className={`font-bold text-sm ${', '<h3\n                            className={`font-sans text-lg font-medium ${')

# 9. Colors for TASK constants
content = content.replace('border-l-violet-500', 'border-l-[#849d85]')
content = content.replace('border-l-cyan-500', 'border-l-[#849d85]')
content = content.replace('border-l-orange-500', 'border-l-[#849d85]')
content = content.replace('bg-violet-500/10 text-violet-400', 'bg-[#849d85]/10 text-[#849d85]')
content = content.replace('bg-cyan-500/10 text-cyan-400', 'bg-[#849d85]/10 text-[#849d85]')
content = content.replace('bg-orange-500/10 text-orange-400', 'bg-[#849d85]/10 text-[#849d85]')

# Write back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Rewrite successful.")
