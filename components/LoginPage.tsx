'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SenderRole } from '@/types';
import { Stethoscope, User, ArrowRight, Shield, Globe, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (role: SenderRole, name: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<SenderRole | null>(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!selectedRole || !name.trim()) return;
    setIsLoading(true);
    // Simulate a brief loading state for smooth transition
    setTimeout(() => {
      onLogin(selectedRole, name.trim());
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* NAO Medical Logo */}
            <Image
              src="https://naomedical.com/main-page-assets/images/about-us/banner-logo.svg"
              alt="NAO Medical"
              width={140}
              height={40}
              className="h-10 sm:h-12 w-auto"
              priority
            />
            <p className="text-xs sm:text-sm text-muted-foreground border-l pl-3">Healthcare Translator</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-green-500" />
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>8+ Languages</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          {/* Welcome Card */}
          <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                Welcome to NAO Medical
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-2">
                Break language barriers in healthcare communication
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 pb-8">
              {/* Step 1: Role Selection */}
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-center mb-4">
                  I am a...
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Doctor Option */}
                  <button
                    onClick={() => setSelectedRole('doctor')}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                      selectedRole === 'doctor'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-lg shadow-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                        selectedRole === 'doctor'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-600 group-hover:bg-blue-200 dark:group-hover:bg-blue-800'
                      }`}>
                        <Stethoscope className="h-10 w-10" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-1">Healthcare Provider</h4>
                        <p className="text-sm text-muted-foreground">
                          Doctor, Nurse, or Medical Staff
                        </p>
                      </div>
                    </div>
                    {selectedRole === 'doctor' && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Patient Option */}
                  <button
                    onClick={() => setSelectedRole('patient')}
                    className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                      selectedRole === 'patient'
                        ? 'border-green-500 bg-green-50 dark:bg-green-950 shadow-lg shadow-green-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-950/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                        selectedRole === 'patient'
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 dark:bg-green-900 text-green-600 group-hover:bg-green-200 dark:group-hover:bg-green-800'
                      }`}>
                        <User className="h-10 w-10" />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xl font-bold mb-1">Patient</h4>
                        <p className="text-sm text-muted-foreground">
                          Seeking medical assistance
                        </p>
                      </div>
                    </div>
                    {selectedRole === 'patient' && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>

                {/* Name Input */}
                {selectedRole && (
                  <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        {selectedRole === 'doctor' ? 'Your Name / ID' : 'Your Name'}
                      </label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={selectedRole === 'doctor' ? 'Dr. Smith' : 'Enter your name'}
                        className="h-12 text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                      />
                    </div>

                    <Button
                      onClick={handleContinue}
                      disabled={!name.trim() || isLoading}
                      className={`w-full h-12 text-lg font-semibold transition-all ${
                        selectedRole === 'doctor'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                          : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Starting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Continue
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Features */}
              {!selectedRole && (
                <div className="mt-10 pt-6 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <Globe className="h-6 w-6 text-blue-600" />
                      </div>
                      <h5 className="font-semibold mb-1">Real-time Translation</h5>
                      <p className="text-sm text-muted-foreground">Support for 8+ languages</p>
                    </div>
                    <div className="p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <h5 className="font-semibold mb-1">Secure & Private</h5>
                      <p className="text-sm text-muted-foreground">HIPAA compliant platform</p>
                    </div>
                    <div className="p-4">
                      <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                      <h5 className="font-semibold mb-1">AI Powered</h5>
                      <p className="text-sm text-muted-foreground">Medical context aware</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-muted-foreground">
        <p>© 2026 NAO Medical. All rights reserved.</p>
      </footer>
    </div>
  );
}
