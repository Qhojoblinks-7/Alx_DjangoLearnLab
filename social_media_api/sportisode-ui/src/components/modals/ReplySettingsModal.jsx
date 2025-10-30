// src/components/modals/ReplySettingsModal.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Users, UserCheck, AtSign } from 'lucide-react';

const ReplySettingsModal = ({ isOpen, onClose, currentSetting = 'everyone', onSave }) => {
  const [selectedSetting, setSelectedSetting] = useState(currentSetting);

  const replyOptions = [
    {
      value: 'everyone',
      label: 'Everyone',
      description: 'Anyone can reply to this post',
      icon: Users,
    },
    {
      value: 'following',
      label: 'People you follow',
      description: 'Only people you follow can reply',
      icon: UserCheck,
    },
    {
      value: 'mentioned',
      label: 'Only people you mentioned',
      description: 'Only people mentioned in the post can reply',
      icon: AtSign,
    },
  ];

  const handleSave = () => {
    onSave(selectedSetting);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-dark-card border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white font-semibold">Who can reply?</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose who can reply to this post. You can change this at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={selectedSetting} onValueChange={setSelectedSetting}>
            {replyOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="border-gray-600 text-blue-500"
                />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <option.icon className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-white font-semibold">{option.label}</div>
                      <div className="text-gray-400 text-sm">{option.description}</div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="flex gap-2 pt-4 border-t border-gray-700">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReplySettingsModal;