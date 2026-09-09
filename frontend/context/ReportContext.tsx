import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Report, Status } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, orderBy, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface ReportContextType {
  reports: Report[];
  addReport: (report: Omit<Report, 'id' | 'timestamp' | 'status' | 'userId'>) => Promise<void>;
  updateReportStatus: (id: string, status: Status) => void;
  deleteReport: (id: string) => Promise<void>;
}

const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
    description: 'Large pothole on Main St, damaging cars.',
    category: 'Pothole',
    priority: 'High',
    status: 'Reported',
    location: { lat: 22.5514, lng: 88.3525, address: 'Park Street, Kolkata' },
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    userId: 'user_1'
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1517781033230-6d45b597cd16?auto=format&fit=crop&q=80&w=400',
    description: 'Graffiti on the side of the public library.',
    category: 'Graffiti',
    priority: 'Low',
    status: 'In Progress',
    location: { lat: 22.5448, lng: 88.3426, address: 'Victoria Memorial, Kolkata' },
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    userId: 'user_2'
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1509390234125-9626cc355b2d?auto=format&fit=crop&q=80&w=400',
    description: 'Street light out at the intersection.',
    category: 'Lighting',
    priority: 'Medium',
    status: 'Resolved',
    location: { lat: 22.5865, lng: 88.4143, address: 'Salt Lake, Kolkata' },
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    userId: 'user_1'
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=400',
    description: 'Fallen tree blocking the sidewalk.',
    category: 'Debris',
    priority: 'High',
    status: 'Reported',
    location: { lat: 22.5851, lng: 88.3468, address: 'Howrah Bridge, Kolkata' },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    userId: 'user_3'
  }
];

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(db ? [] : MOCK_REPORTS);

  useEffect(() => {
    if (!db) {
      console.log('Firebase DB not initialized. Using mock data.');
      return;
    }
    
    // Subscribe to Firestore 'reports' collection
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData: Report[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reportsData.push({
          id: docSnap.id,
          imageUrl: data.imageUrl,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: data.status,
          location: data.location,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : data.timestamp,
          userId: data.userId
        } as Report);
      });
      setReports(reportsData);
    }, (error) => {
      console.error('Error fetching reports from Firestore:', error);
      // Fallback to mock data if there's an error (e.g., missing permissions)
      setReports(MOCK_REPORTS);
    });

    return () => unsubscribe();
  }, []);

  const addReport = async (reportData: Omit<Report, 'id' | 'timestamp' | 'status' | 'userId'>) => {
    const newReportData = {
      ...reportData,
      status: 'Reported' as Status,
      userId: 'user_1', // Assuming current user
    };

    if (db) {
      try {
        await addDoc(collection(db, 'reports'), {
          ...newReportData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error adding document:', error);
      }
    } else {
      // Local fallback
      const newReport: Report = {
        ...newReportData,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
      };
      setReports(prev => [newReport, ...prev]);
    }
  };

  const updateReportStatus = async (id: string, status: Status) => {
    if (db) {
      try {
        const docRef = doc(db, 'reports', id);
        await updateDoc(docRef, { status });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    } else {
      // Local fallback
      setReports(prev => prev.map(report => 
        report.id === id ? { ...report, status } : report
      ));
    }
  };

  const deleteReport = async (id: string) => {
    if (db) {
      try {
        const docRef = doc(db, 'reports', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    } else {
      // Local fallback
      setReports(prev => prev.filter(report => report.id !== id));
    }
  };

  return (
    <ReportContext.Provider value={{ reports, addReport, updateReportStatus, deleteReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
}
