
import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: (userType: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const predefinedUsers = {
    'gmora@duccio.mx': { password: 'admin', type: 'Admin' },
    'dgomez@duccio.mx': { password: 'user', type: 'User' },
    'su@satoritech.dev': { password: 'SatoriTechD', type: 'SuperuserAccess' } // New Superuser credentials
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const userEmail = email.toLowerCase();
    const user = predefinedUsers[userEmail as keyof typeof predefinedUsers];

    if (user && user.password === password) {
      onLoginSuccess(user.type);
    } else {
      setError('Correo electrónico o contraseña incorrectos.');
    }
  };

  const imageUrl = "https://raw.githubusercontent.com/ABoldCodeU/imagenes-para-proyectos/0bffcce064f89b852d174af8bf84beb767c0c5da/imagenes/Captura%20de%20pantalla%202025-05-21%201857102.png";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F4F1' }}>
      <header style={{ backgroundColor: '#0A4D68' }} className="py-8 shadow-md">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold text-white text-center">Login</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white shadow-2xl rounded-lg w-full max-w-4xl md:flex overflow-hidden">
          {/* Image Column */}
          <div className="hidden md:block md:w-1/2">
            <img 
              src={imageUrl} 
              alt="Visual de inicio de sesión" 
              className="object-cover h-full w-full" 
            />
          </div>
          
          {/* Form Column */}
          <div className="w-full md:w-1/2 p-8 sm:p-12">
            <h2 className="text-3xl font-bold text-black mb-2 text-left">
              INICIAR SESIÓN
            </h2>
            <p className="text-gray-600 mb-8 text-left text-sm">
              ¡Bienvenido al inicio de sesión de Price Tracker!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email" // Standard email input
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ backgroundColor: '#F5F5F5' }}
                  className="mt-1 block w-full px-3 py-3 border-transparent rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-colors"
                  placeholder="su@correo.com"
                  aria-label="Correo electrónico"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ backgroundColor: '#F5F5F5' }}
                  className="mt-1 block w-full px-3 py-3 border-transparent rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent sm:text-sm transition-colors"
                  placeholder="••••••••"
                  aria-label="Contraseña"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
                  {error}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  style={{ backgroundColor: '#087F8C' }}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0A4D68] transition-opacity"
                >
                  Iniciar sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer style={{ backgroundColor: '#333333' }} className="text-white text-center py-6 mt-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} SatoriTech. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Login;
