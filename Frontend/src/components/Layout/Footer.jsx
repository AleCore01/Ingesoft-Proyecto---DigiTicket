import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-black text-white py-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Columna 1 - Sobre DigiTicket */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-fuchsia-400">DigiTicket</h3>
            <p className="text-gray-400 text-sm">
              Tu plataforma de confianza para la compra de entradas a los mejores eventos.
            </p>
          </div>

          {/* Columna 2 - Enlaces rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-fuchsia-400">Enlaces rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Eventos
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Términos y condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  Política de privacidad
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 3 - Contacto */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-fuchsia-400">Contacto</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-fuchsia-400" />
                info@digiticket.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-fuchsia-400" />
                +51 999 888 777
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-fuchsia-400" />
                Lima, Perú
              </li>
            </ul>
          </div>

          {/* Columna 4 - Redes sociales */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-fuchsia-400">Síguenos</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fuchsia-600 transition"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fuchsia-600 transition"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-fuchsia-600 transition"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Línea divisora */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <p className="text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} DigiTicket. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
