

import React, { useMemo } from 'react';
import Card from '../ui/Card';
import { Booking, Trainer, Customer, ClassType } from '../../types';
import { Award, Dumbbell, Gift, User, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
// FIX: Consolidated `date-fns` imports.
import { format } from 'date-fns/format';
import { differenceInDays } from 'date-fns/differenceInDays';
import { isBefore } from 'date-fns/isBefore';
import { setYear } from 'date-fns/setYear';
import { startOfDay } from 'date-fns/startOfDay';
import { useStudioData } from '../../hooks/useStudioData';

interface AtAGlanceProps {
    bookings: Booking[];
    trainers: Trainer[];
    customers: Customer[];
    classTypes: ClassType[];
}

const AtAGlance: React.FC<AtAGlanceProps> = ({ bookings, trainers, customers, classTypes }) => {
    const { now } = useStudioData();
    
    const insights = useMemo(() => {
        // Most Booked Trainer
        const trainerSessionCounts = bookings.reduce((acc, booking) => {
            acc[booking.trainerId] = (acc[booking.trainerId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topTrainerId = Object.keys(trainerSessionCounts).length > 0
            ? Object.keys(trainerSessionCounts).reduce((a, b) => trainerSessionCounts[a] > trainerSessionCounts[b] ? a : b)
            : null;
        
        const topTrainer = topTrainerId ? trainers.find(t => t.id === topTrainerId) : null;
        
        // Most Popular Class
        const classTypeCounts = bookings.reduce((acc, booking) => {
            acc[booking.classTypeId] = (acc[booking.classTypeId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const topClassTypeId = Object.keys(classTypeCounts).length > 0
            ? Object.keys(classTypeCounts).reduce((a, b) => classTypeCounts[a] > classTypeCounts[b] ? a : b)
            : null;
            
        const topClassType = topClassTypeId ? classTypes.find(ct => ct.id === topClassTypeId) : null;
        
        // Upcoming Birthdays
        const today = startOfDay(now);
        const upcomingBirthdays = customers
            .filter(c => c.birthDate)
            .map(c => {
                let birthDateThisYear = setYear(new Date(c.birthDate!), today.getFullYear());
                if (isBefore(birthDateThisYear, today)) {
                    birthDateThisYear = setYear(birthDateThisYear, today.getFullYear() + 1);
                }
                return {
                    customer: c,
                    daysUntil: differenceInDays(birthDateThisYear, today)
                };
            })
            .filter(item => item.daysUntil >= 0 && item.daysUntil <= 7)
            .sort((a, b) => a.daysUntil - b.daysUntil);
            
        // First booking of the day
        const firstBookingToday = bookings
            .filter(b => isBefore(today, new Date(b.dateTime)))
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())[0];
            
        return {
            topTrainer,
            topTrainerSessions: topTrainerId ? trainerSessionCounts[topTrainerId] : 0,
            topClassType,
            topClassSessions: topClassTypeId ? classTypeCounts[topClassTypeId] : 0,
            firstBooking: firstBookingToday,
            upcomingBirthdays: upcomingBirthdays.slice(0, 3) // show top 3
        };
        
    }, [bookings, trainers, customers, classTypes, now]);

    const InsightItem: React.FC<{ icon: React.ElementType, children: React.ReactNode }> = ({ icon: Icon, children }) => (
        <div className="flex items-start text-sm">
            <Icon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-gray-700">{children}</div>
        </div>
    );

    return (
        <Card>
            <h3 className="text-lg font-semibold text-gray-700 mb-4">At a Glance</h3>
            <div className="space-y-4">
                 {insights.topTrainer && (
                    <InsightItem icon={Award}>
                        <strong>Top Trainer: </strong> 
                        <Link to={`/trainers/${insights.topTrainer.id}`} className="font-semibold text-blue-600 hover:underline">
                            {insights.topTrainer.firstName} {insights.topTrainer.lastName}
                        </Link> with {insights.topTrainerSessions} sessions.
                    </InsightItem>
                )}
                {insights.topClassType && (
                    <InsightItem icon={Dumbbell}>
                        <strong>Most Popular: </strong> {insights.topClassType.name} with {insights.topClassSessions} sessions.
                    </InsightItem>
                )}
                 {insights.upcomingBirthdays.length > 0 && (
                    <InsightItem icon={Gift}>
                        <strong>Birthdays Soon: </strong> 
                        {insights.upcomingBirthdays.map((item, index) => (
                             <React.Fragment key={item.customer.id}>
                                <Link to={`/customers/${item.customer.id}`} className="font-semibold text-blue-600 hover:underline">
                                    {item.customer.firstName} {item.customer.lastName}
                                </Link>
                                 <span className="text-xs text-gray-500"> ({item.daysUntil === 0 ? 'Today!' : `in ${item.daysUntil}d`})</span>
                                {index < insights.upcomingBirthdays.length - 1 && ', '}
                            </React.Fragment>
                        ))}
                        .
                    </InsightItem>
                )}
                {insights.firstBooking && (
                     <InsightItem icon={Zap}>
                        <strong>First Up: </strong>
                        {insights.firstBooking.customerIds.map(id => {
                            const customer = customers.find(c=>c.id === id);
                            return customer ? `${customer.firstName} ${customer.lastName}` : '';
                        }).join(', ')} at {format(new Date(insights.firstBooking.dateTime), 'HH:mm')}.
                    </InsightItem>
                )}
                 {Object.values(insights).every(val => !val || (Array.isArray(val) && val.length === 0)) && (
                    <div className="text-center text-gray-500 py-4">
                        <User className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-2 text-sm">No insights for this period.</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default AtAGlance;