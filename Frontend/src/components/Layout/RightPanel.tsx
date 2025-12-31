import type React from "react"
import logoPng from "../../assets/images/logo_blanco.png";

const RightPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-DigiTicket-gradient rounded-r-3xl relative overflow-hidden">
      <div className="flex flex-col items-center justify-center w-full p-12 text-white">
        <div className="mb-8">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
            <img src={logoPng} alt="DigiTicket Logo" className="w-16 h-16" />
          </div>
        </div>

        <h1 className="text-5xl font-bold text-center mb-4 text-balance">DigiTicket</h1>

        <div className="absolute bottom-8 right-8 text-sm opacity-80">
          2025©Bytecraft. Todos los derechos reservados
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full"></div>
        <div className="absolute top-1/3 -left-10 w-20 h-20 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-white/5 rounded-full"></div>
      </div>
    </div>
  )
}

export default RightPanel
