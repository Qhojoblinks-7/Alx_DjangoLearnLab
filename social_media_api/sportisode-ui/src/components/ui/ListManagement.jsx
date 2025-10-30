// src/components/ui/ListManagement.jsx
import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  BookOpen,
  Heart,
  List,
  Star,
  Users,
  Trophy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const ListManagement = ({ lists, onCreateList, onEditList, onDeleteList, onSelectList }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('List');

  const defaultLists = [
    { id: 'reading', name: 'Reading List', icon: BookOpen, description: 'Posts to read later', system: true },
    { id: 'favorites', name: 'Favorites', icon: Heart, description: 'Your favorite posts', system: true },
    { id: 'highlights', name: 'Highlights', icon: Star, description: 'Best posts', system: true },
  ];

  const iconOptions = [
    { name: 'List', icon: List, color: 'text-gray-400' },
    { name: 'BookOpen', icon: BookOpen, color: 'text-blue-400' },
    { name: 'Heart', icon: Heart, color: 'text-red-400' },
    { name: 'Star', icon: Star, color: 'text-yellow-400' },
    { name: 'Users', icon: Users, color: 'text-green-400' },
    { name: 'Trophy', icon: Trophy, color: 'text-purple-400' },
  ];

  const getIconComponent = (iconName) => {
    const iconOption = iconOptions.find(opt => opt.name === iconName);
    return iconOption ? iconOption.icon : List;
  };

  const handleCreateList = () => {
    if (newListName.trim()) {
      onCreateList({
        name: newListName.trim(),
        description: newListDescription.trim(),
        icon: selectedIcon
      });
      setNewListName('');
      setNewListDescription('');
      setSelectedIcon('List');
      setIsCreating(false);
    }
  };

  const allLists = [...defaultLists, ...(Array.isArray(lists) ? lists : [])];

  return (
    <div className="space-y-4">
      {/* Create New List Section */}
      {isCreating ? (
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName" className="text-gray-300">List Name</Label>
              <Input
                id="listName"
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateList()}
              />
            </div>

            <div>
              <Label htmlFor="listDescription" className="text-gray-300">Description (Optional)</Label>
              <Input
                id="listDescription"
                placeholder="Describe your list..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="mt-1 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">Icon</Label>
              <div className="flex gap-2 mt-2">
                {iconOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => setSelectedIcon(option.name)}
                    className={`p-2 rounded-lg border-2 transition-colors ${
                      selectedIcon === option.name
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <option.icon className={`h-4 w-4 ${option.color}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateList} disabled={!newListName.trim()}>
                Create List
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setIsCreating(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New List
        </Button>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allLists.map((list) => {
          const IconComponent = getIconComponent(list.icon);
          const iconOption = iconOptions.find(opt => opt.name === list.icon);

          return (
            <Card
              key={list.id}
              className="p-4 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
              onClick={() => onSelectList && onSelectList(list)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${iconOption ? iconOption.color.replace('text-', 'bg-').replace('-400', '-500/20') : 'bg-gray-500/20'}`}>
                    <IconComponent className={`h-5 w-5 ${iconOption?.color || 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{list.name}</h3>
                    <p className="text-gray-400 text-sm">{list.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {list.postCount || 0} posts
                      </span>
                      {list.system && (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!list.system && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditList && onEditList(list);
                        }}
                        className="text-gray-300 hover:text-white"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit List
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${list.name}"? This action cannot be undone.`)) {
                            onDeleteList && onDeleteList(list.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete List
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {allLists.length === 0 && !isCreating && (
        <div className="text-center py-8 text-gray-400">
          <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No lists created yet</p>
          <p className="text-sm">Create your first list to organize your posts</p>
        </div>
      )}
    </div>
  );
};

export default ListManagement;