
import React, { useState } from 'react';
import Card from './common/Card';
import { SearchIcon, PencilIcon, FilterIcon } from './icons/FeatureIcons';
import { User } from '../types';

const initialUsers: User[] = [
  { id: '1', name: 'User1', email: 'User@gmal.com', profile: 'Administrador', isActive: true },
  { id: '2', name: 'User2', email: 'User2@example.com', profile: 'User', isActive: false },
  { id: '3', name: 'User3', email: 'User3@test.co', profile: 'User', isActive: true },
];

// Basic Toggle Switch component
const ToggleSwitch: React.FC<{
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ id, checked, onChange }) => {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input 
          id={id} 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
};


const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleToggleActive = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-textHeader">Usuarios</h2>

      <Card>
        <div className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2">
                <button 
                    aria-label="Filtrar usuarios"
                    className="p-2 text-gray-500 hover:text-primary rounded-md hover:bg-gray-100 transition-colors"
                >
                    <FilterIcon className="w-5 h-5" />
                </button>
                <button
                onClick={() => alert('Funcionalidad "Agregar usuario" (Próximamente)')}
                className="px-4 py-2 bg-[#088395] hover:bg-[#077080] text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#088395]"
                >
                Agregar usuario
                </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {["Nombre", "Correo electrónico", "Perfil", "Estado", "Acciones"].map(header => (
                    <th key={header} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-textMuted uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-contentBorder">
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-textHeader">{user.name}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{user.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-textMuted">{user.profile}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <ToggleSwitch 
                        id={`user-toggle-${user.id}`} 
                        checked={user.isActive} 
                        onChange={() => handleToggleActive(user.id)} 
                      />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm">
                      <button 
                        onClick={() => alert(`Editar usuario ${user.name} (Próximamente)`)}
                        aria-label={`Editar usuario ${user.name}`}
                        className="text-gray-400 hover:text-primary transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="text-center py-4 text-textMuted">
                            No se encontraron usuarios que coincidan con la búsqueda.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserManagement;
