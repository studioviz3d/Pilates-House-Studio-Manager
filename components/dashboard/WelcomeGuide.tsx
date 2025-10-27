import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, UserPlus, CalendarPlus, Settings, ArrowRight } from 'lucide-react';

const WelcomeGuide: React.FC = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'Add Your Trainers',
      description: 'Create profiles for your instructors and set their payment rates.',
      link: '/manage/trainers',
      cta: 'Add Trainers'
    },
    {
      icon: UserPlus,
      title: 'Add Your First Customer',
      description: 'Start building your client list and sell them their first package.',
      link: '/manage/customers',
      cta: 'Add Customers'
    },
    {
      icon: CalendarPlus,
      title: 'Schedule a Booking',
      description: 'Once you have trainers and customers, get them on the calendar!',
      link: '/dashboard', // The booking modal is on this page
      cta: 'New Booking'
    },
    {
      icon: Settings,
      title: 'Customize Your Settings',
      description: 'Personalize your studio name, currency, and class types.',
      link: '/settings',
      cta: 'Go to Settings'
    }
  ];

  return (
    <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <Dumbbell className="mx-auto h-12 w-12 text-blue-500" />
      <h1 className="mt-4 text-3xl font-bold text-gray-800">Welcome to StudioFlow!</h1>
      <p className="mt-2 text-lg text-gray-600">
        Your studio is ready. Here are a few steps to get you started.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {steps.map((step, index) => (
          <div key={index} className="p-6 bg-gray-50 rounded-lg border border-gray-100 flex flex-col">
            <step.icon className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-800">{step.title}</h3>
            <p className="text-sm text-gray-600 mt-1 flex-grow">{step.description}</p>
            <Link to={step.link} className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800">
              {step.cta}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeGuide;
