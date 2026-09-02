import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { feesApi } from '@/api/fees';
import { enrollmentsApi } from '@/api/enrollments';
import { formatCurrency, formatDate } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  CreditCard,
  DollarSign,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  Layers,
  Calendar,
} from 'lucide-react';

export function StudentFees() {
  
  const { data: feesData, isLoading: feesLoading, isError: feesIsError, error: feesError } = useQuery({
    queryKey: ['fees', 'my'],
    queryFn: feesApi.getMyFees,
  });

  
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: enrollmentsApi.getMyEnrollments,
  });

  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const rawFees = Array.isArray(feesData) ? feesData : [];

  
  const feeListMap = new Map();

  
  rawFees.forEach((fee) => {
    const courseId = fee.courseId?._id || fee.courseId;
    const key = String(courseId);
    const matchedEnr = enrollments.find((e) => String(e.courseId?._id || e.courseId) === key);

    feeListMap.set(key, {
      _id: fee._id,
      course: fee.courseId,
      batch: matchedEnr?.batch,
      totalFee: Number(fee.totalFee),
      paidAmount: Number(fee.paidAmount) || 0,
      dueAmount: Number(fee.dueAmount) !== undefined ? Number(fee.dueAmount) : Math.max(0, Number(fee.totalFee) - (Number(fee.paidAmount) || 0)),
      status: fee.status || 'unpaid',
      paymentDate: fee.paymentDate,
    });
  });

  
  enrollments.forEach((enr) => {
    if (!enr.courseId) return;
    const courseId = enr.courseId?._id || enr.courseId;
    const key = String(courseId);

    if (!feeListMap.has(key)) {
      const courseObj = enr.courseId;
      const totalFee = Number(courseObj?.fee) || 15000;
      feeListMap.set(key, {
        _id: `temp_${enr._id}`,
        course: courseObj,
        batch: enr.batch,
        totalFee,
        paidAmount: 0,
        dueAmount: totalFee,
        status: 'unpaid',
        paymentDate: null,
      });
    }
  });

  const studentFeeItems = Array.from(feeListMap.values());

  const totalTuition = studentFeeItems.reduce((sum, item) => sum + item.totalFee, 0);
  const totalPaid = studentFeeItems.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalDue = studentFeeItems.reduce((sum, item) => sum + item.dueAmount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="capitalize text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'partial':
        return <Badge variant="warning" className="capitalize text-[11px]"><AlertCircle className="h-3 w-3 mr-1" /> Partial</Badge>;
      case 'unpaid':
        return <Badge variant="destructive" className="capitalize text-[11px]"><XCircle className="h-3 w-3 mr-1" /> Unpaid</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px] capitalize">{status}</Badge>;
    }
  };

  const isLoading = feesLoading || enrollmentsLoading;

  return (
    <div className="space-y-6">
      {}
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
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : formatCurrency(totalTuition)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Across {studentFeeItems.length} enrolled programs</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Total Paid to Date <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading ? '--' : formatCurrency(totalPaid)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total installments cleared</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center justify-between">
              Remaining Balance Due <AlertCircle className="h-4 w-4 text-destructive" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? '--' : formatCurrency(totalDue)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalDue === 0 ? 'All fees settled in full' : 'Outstanding fee payable'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content State */}
      {isLoading ? (
        <LoadingSpinner text="Fetching financial records..." />
      ) : feesIsError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {feesError?.message || 'Failed to load course fee details'}
        </div>
      ) : studentFeeItems.length === 0 ? (
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
            {studentFeeItems.map((item) => {
              const course = item.course || {};
              const batch = item.batch || {};

              return (
                <div key={item._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm sm:text-base">{course.name || 'Academic Course'}</span>
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30 font-mono">
                        {course.code || 'COURSE'}
                      </Badge>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {batch.name && (
                        <span className="flex items-center">
                          <Layers className="h-3 w-3 mr-1 text-primary" /> {batch.name}
                        </span>
                      )}
                      {item.paymentDate && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-emerald-500" /> Last Payment: {formatDate(item.paymentDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Figures */}
                  <div className="flex items-center gap-6 self-end sm:self-center text-right">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Total Fee</p>
                      <p className="font-semibold text-foreground">{formatCurrency(item.totalFee)}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground">Paid Amount</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.paidAmount)}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-muted-foreground">Due Amount</p>
                      <p className="font-bold text-destructive">{formatCurrency(item.dueAmount)}</p>
                    </div>
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
