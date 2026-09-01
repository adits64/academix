import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/api/enrollments';
import { formatCurrency, formatDate } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  CreditCard,
  DollarSign,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

export function StudentFees() {
  const { data: enrollmentsData, isLoading, isError, error } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  const totalTuition = enrollments.reduce((sum, enr) => {
    return sum + (enr.courseId?.fee || 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fees & Financial Status</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Overview of your academic program fees, payment records, and account standing.
          </p>
        </div>
        <Badge variant="outline" className="w-fit text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300">
          <CreditCard className="h-3.5 w-3.5 mr-1" /> Student Account Active
        </Badge>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Total Course Tuition <DollarSign className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(totalTuition)}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across {enrollments.length} enrolled programs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Active Enrollments <BookOpen className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{enrollments.length}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Approved registrations</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Account Standing <CheckCircle2 className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">In Good Standing</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Campus billing status</p>
          </CardContent>
        </Card>
      </div>

      {/* Content State */}
      {isLoading ? (
        <LoadingSpinner text="Fetching financial records..." />
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error.message || 'Failed to load course fee details'}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Course Fee Records"
          description="You are not enrolled in any fee-bearing courses at this time."
        />
      ) : (
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-bold flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" /> Enrolled Course Fee Breakdown
            </CardTitle>
          </CardHeader>

          <div className="divide-y text-xs sm:text-sm">
            {enrollments.map((enr) => {
              const course = enr.courseId || {};
              const batch = enr.batch || {};

              return (
                <div key={enr._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{course.name || 'Academic Course'}</span>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        {course.code || 'COURSE'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Layers className="h-3 w-3 mr-1 text-primary" /> {batch.name || 'Batch'}
                      </span>
                      <span>•</span>
                      <span>Duration: {course.duration ? `${course.duration} Months` : 'N/A'}</span>
                      <span>•</span>
                      <span>Registered: {formatDate(enr.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold text-foreground">
                      {formatCurrency(course.fee || 0)}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 mt-1">
                      Enrolled
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Support Info Box */}
      <Card className="bg-muted/30 border border-dashed">
        <CardContent className="p-4 flex items-start space-x-3 text-xs text-muted-foreground">
          <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-foreground">Payment Inquiries & Invoicing</p>
            <p>
              For installment payment receipts, bank wire verification, or scholarship adjustments, please contact the Accounts & Finance Administration Office.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentFees;
