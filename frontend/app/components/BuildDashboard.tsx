"use client";

import React, { useState } from "react";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import HomePageSubtitles from "./HomePageSubtitles";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, Mic, Volume2 } from "lucide-react";
import Twemoji from "react-twemoji";
import { createPersonality } from "../actions";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface SettingsDashboardProps {
    selectedUser: IUser;
    allLanguages: ILanguage[];
}

const EmojiComponent = ({ emoji }: { emoji: string | undefined }) => {
    return (
        <div className="w-7 h-7 flex items-center justify-center">
            <Twemoji
                options={{ className: "twemoji w-7 h-7 flex-shrink-0" }}
            >
                {emoji}
            </Twemoji>
        </div>
    );
};


const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
    allLanguages,
}) => {
    const supabase = createClient();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<'personality' | 'voice'>('personality');


    const [languageState, setLanguageState] = useState<string>(
        selectedUser.language_code! // Initial value from props
    );

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        prompt: '',
        voice: '',
        voiceCharacteristics: {
          features: '',
          emotion: 'neutral'
        }
      });
      
      const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    
      const handleInputChange = (field: string, value: string) => {
        setFormData({
          ...formData,
          [field]: value
        });
      };
    
      const handleVoiceCharacteristicChange = (characteristic: string, value: string) => {
        setFormData({
          ...formData,
          voiceCharacteristics: {
            ...formData.voiceCharacteristics,
            [characteristic]: value
          }
        });
      };
    
      const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const personality = await createPersonality(selectedUser.user_id, {
          title: formData.title,
          subtitle: "",
          character_prompt: formData.prompt,
          oai_voice: formData.voice as OaiVoice,
          voice_prompt: formData.voiceCharacteristics.features + "\nThe voice should be " + formData.voiceCharacteristics.emotion,
          is_doctor: false,
          is_child_voice: false,
          key: formData.title.toLowerCase().replace(/ /g, '_') + "_" + uuidv4(),
          creator_id: selectedUser.user_id,
          short_description: formData.description
        });

        if (personality) {
          toast({
            title: "New AI Character created",
            description: "Your character has been created!",
            duration: 3000,
          });
          router.push(`/home`);
        }
      };

      const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    
      const previewVoice = (voiceId: string) => {
        // Stop any currently playing preview
        if (audioElement) {
          audioElement.pause();
          audioElement.currentTime = 0;
        }
        
        const audioSampleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/oai_voices/${voiceId}.wav`;
        setPreviewingVoice(voiceId);
        
        // Create and play audio element
        const audio = new Audio(audioSampleUrl);
        setAudioElement(audio);
        
        // Play the audio
        audio.play().catch(error => {
          console.error("Error playing audio:", error);
          setPreviewingVoice(null);
        });
        
        // Reset the previewing state when audio ends
        audio.onended = () => {
          setPreviewingVoice(null);
        };
        
        // Fallback in case audio doesn't trigger onended
        setTimeout(() => {
          if (previewingVoice === voiceId) {
            setPreviewingVoice(null);
          }
        }, 10000); // 10 second fallback
      };
    
      const voices = [
        { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', color: 'bg-blue-100', emoji: '🧑' },
        { id: 'echo', name: 'Echo', description: 'Warm and melodic', color: 'bg-purple-100', emoji: '👩‍🎤' },
        { id: 'shimmer', name: 'Shimmer', description: 'Clear and bright', color: 'bg-cyan-100', emoji: '👱‍♀️' },
        { id: 'ash', name: 'Ash', description: 'Soft and thoughtful', color: 'bg-gray-100', emoji: '🧔' },
        { id: 'ballad', name: 'Ballad', description: 'Melodic and emotive', color: 'bg-indigo-100', emoji: '🎭' },
        { id: 'coral', name: 'Coral', description: 'Warm and friendly', color: 'bg-orange-100', emoji: '👩' },
        { id: 'sage', name: 'Sage', description: 'Wise and measured', color: 'bg-green-100', emoji: '🧓' },
        { id: 'verse', name: 'Verse', description: 'Poetic and expressive', color: 'bg-rose-100', emoji: '👨‍🎨' }
      ];
    
      const emotionOptions = [
        { value: 'neutral', label: 'Neutral', icon: '😐', color: 'bg-red-100' },
        { value: 'cheerful', label: 'Cheerful', icon: '😊', color: 'bg-yellow-100' },
        { value: 'serious', label: 'Serious', icon: '🧐', color: 'bg-blue-100' },
        { value: 'calm', label: 'Calm', icon: '😌', color: 'bg-teal-100' },
        { value: 'excited', label: 'Excited', icon: '😃', color: 'bg-orange-100' },
        { value: 'professional', label: 'Professional', icon: '👔', color: 'bg-green-100' }
      ];
    

    const onLanguagePicked = async (languagePicked: string) => {
        setLanguageState(languagePicked);
        await updateUser(
            supabase,
            {
                language_code: languagePicked,
            },
            selectedUser.user_id
        );
    };

    const Heading = () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center sm:justify-normal justify-between max-w-screen-sm">
                    <div className="flex flex-row gap-4 items-center justify-between w-full">
                        <h1 className="text-3xl font-normal">Create your AI Character</h1>
                    </div>
                </div>
                <HomePageSubtitles user={selectedUser} page="create" />
            </div>
        );
    };

    return (
        <div className="overflow-hidden pb-2 w-full flex-auto flex flex-col pl-1 max-w-screen-sm">
            <Heading />
            <form onSubmit={handleSubmit} className="space-y-6 mt-4 w-full pr-1">
          
            {currentStep === 'personality' ? <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Character Title</Label>
              <Input 
                id="title"
                placeholder="E.g., 'Storytelling Assistant'" 
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Give your AI character a name or title.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                placeholder="Describe what your AI character does and its personality..." 
                rows={2}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Briefly describe your character's purpose and personality.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea 
                id="prompt"
                placeholder="Enter specific instructions for how your AI should respond..." 
                rows={4}
                value={formData.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
              />
              <p className="text-sm text-gray-500">
                Detailed instructions that define how your AI responds to users.
              </p>
            </div>
            </div> :
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voice">Voice Features</Label>
              <p className="text-sm text-gray-500">
                Click a voice to preview how it sounds. Select one for your character.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {voices.map((voice) => (
                  <div 
                  key={voice.id}
                  className={`
                    rounded-lg border p-3 transition-all relative
                    ${formData.voice === voice.id 
                      ? 'border-2 border-blue-500 shadow-sm ' + voice.color 
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    }
                  `}
                  onClick={() => {
                    handleInputChange('voice', voice.id);
                    previewVoice(voice.id);
                  }}
                >
                  <div className="flex flex-col">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                      <div className="text-2xl mt-0.5">
                        <EmojiComponent emoji={voice.emoji} />
                      </div>
                      <div className="flex flex-col text-center sm:text-left">
                        <span className="font-medium">{voice.name}</span>
                        <span className="text-xs text-gray-600">{voice.description}</span>
                      </div>
                    </div>
                    
                    {previewingVoice === voice.id && (
  <div className="absolute top-2 right-2">
    <div className="animate-pulse text-blue-500">
      <Volume2 size={20} />
    </div>
  </div>
)}
                  </div>
                </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
                  <Label htmlFor="voiceCharacteristics">Voice Characteristics</Label>
                  <Textarea 
  id="voiceCharacteristics"
  placeholder="e.g., Medium pitch, Normal speed, Clear voice" 
  className="w-full min-h-16"
  rows={2}
  value={formData.voiceCharacteristics.features}
  onChange={(e) => setFormData(prev => ({
    ...prev,
    voiceCharacteristics: {
      ...prev.voiceCharacteristics,
      features: e.target.value
    }
  }))}
/>
            </div>
                <div className="space-y-3">
                  <Label className="block mb-2">Emotional Tone</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {emotionOptions.map((emotion) => (
                      <div 
                        key={emotion.value}
                        className={`
                          rounded-lg border p-3 cursor-pointer transition-all
                          ${formData.voiceCharacteristics.emotion === emotion.value 
                            ? 'border-2 border-blue-500 shadow-sm ' + emotion.color 
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                        onClick={() => handleVoiceCharacteristicChange('emotion', emotion.value)}
                      >
                        <div className="flex flex-col items-center text-center">
                          <EmojiComponent emoji={emotion.icon} />
                          <span className="text-sm font-medium">{emotion.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>}
           
           
            {currentStep === 'personality' ? (
          <Button 
            onClick={() => setCurrentStep('voice')}
            className="ml-auto flex flex-row gap-2 items-center"
          >
            Add Voice Features <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
            <div className="w-full flex justify-between">
            <Button 
              variant="outline" 
              className="flex flex-row gap-2 items-center"
              onClick={() => setCurrentStep('personality')}
            >
              <ArrowLeft className="w-4 h-4" /> Back 
            </Button>
            <Button 
              variant="default"
              className="flex flex-row gap-2 items-center"
              type="submit"
              disabled={formData.title === '' || formData.description === '' || formData.prompt === '' || formData.voice === '' || formData.voiceCharacteristics.features === ''}
            >
              Create <Check className="w-4 h-4" />
            </Button>
          </div>
        )}
        </form>
        </div>
    );
};

export default SettingsDashboard;
