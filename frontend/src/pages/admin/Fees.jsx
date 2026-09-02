import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { feesApi } from '@/api/fees';
import { enrollmentsApi } from '@/api/enrollments';
import { coursesApi } from '@/api/courses';
import { useNotification } from '@/hooks/useNotification';
import { formatCurrency, formatDate, getInitials } from '@/utils/format';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

import {
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  Receipt,
  Plus,
  Edit2,
  FileText,
  Printer,
  Calendar,
  Wallet,
  Loader2,
} from 'lucide-react';

export function Fees() {
  const navigate = useNavigate();
  const notify = useNotification();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(null);
  const [adjustingFeeRecord, setAdjustingFeeRecord] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Form Fields for Add / Collect Fee Payment Modal
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [addPaymentAmount, setAddPaymentAmount] = useState('');
  const [addPaymentMethod, setAddPaymentMethod] = useState('Cash');
  const [addPaymentDate, setAddPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [addPaymentRemarks, setAddPaymentRemarks] = useState('');

  // Form Fields for Record Payment Modal (Row)
  const [rowPaymentAmount, setRowPaymentAmount] = useState('');
  const [rowPaymentMethod, setRowPaymentMethod] = useState('Cash');
  const [rowPaymentDate, setRowPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [rowPaymentRemarks, setRowPaymentRemarks] = useState('');

  // Form Fields for Fee Adjustment Modal
  const [customTotalFee, setCustomTotalFee] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Fetch Fees from Backend
  const { data: feesData, isLoading: feesLoading, isError: feesIsError, error: feesError } = useQuery({
    queryKey: ['fees'],
    queryFn: feesApi.getAllFees,
  });

  // Fetch Enrollments (for student/course linking and batch names)
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
  });

  // Fetch Courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
  });

  const courses = coursesData?.courses || [];
  const rawEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const rawFees = Array.isArray(feesData) ? feesData : [];

  // Helper to resolve batch name
  const getBatchName = (studentId, courseId) => {
    const sId = String(studentId?._id || studentId || '');
    const cId = String(courseId?._id || courseId || '');
    const enr = rawEnrollments.find((e) => {
      const matchStudent = String(e.studentId?._id || e.studentId || '') === sId;
      const matchCourse = String(e.courseId?._id || e.courseId || '') === cId;
      return matchStudent && matchCourse;
    });

    if (enr) {
      if (enr.batch?.name) return enr.batch.name;
      if (enr.batchId?.name) return enr.batchId.name;
      const parentCourse = courses.find((c) => String(c._id) === cId);
      if (parentCourse?.batches) {
        const found = parentCourse.batches.find((b) => String(b._id) === String(enr.batchId || enr.batch?._id || enr.batch));
        if (found?.name) return found.name;
      }
    }
    return 'Morning Batch A';
  };

  // Build unified fee record list from backend fee records and enrollments
  const feeRecordsMap = new Map();

  // 1. Add all backend fee records
  rawFees.forEach((fee) => {
    const studentId = fee.studentId?._id || fee.studentId;
    const courseId = fee.courseId?._id || fee.courseId;
    const key = `${studentId}_${courseId}`;
    const courseObj = courses.find((c) => String(c._id) === String(courseId)) || fee.courseId;

    feeRecordsMap.set(key, {
      _id: fee._id,
      feeId: fee._id,
      student: fee.studentId,
      course: courseObj,
      batchName: getBatchName(studentId, courseId),
      totalFee: Number(fee.totalFee),
      paidAmount: Number(fee.paidAmount) || 0,
      dueAmount: Number(fee.dueAmount) !== undefined ? Number(fee.dueAmount) : Math.max(0, Number(fee.totalFee) - (Number(fee.paidAmount) || 0)),
      status: fee.status || 'unpaid',
      paymentDate: fee.paymentDate,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
      isPersisted: true,
    });
  });

  // 2. Include active enrollments that may not have explicit fee documents yet
  rawEnrollments.forEach((enr) => {
    if (!enr.studentId || !enr.courseId) return;
    const studentId = enr.studentId?._id || enr.studentId;
    const courseId = enr.courseId?._id || enr.courseId;
    const key = `${studentId}_${courseId}`;

    if (!feeRecordsMap.has(key)) {
      const courseObj = courses.find((c) => String(c._id) === String(courseId)) || enr.courseId;
      const totalFee = Number(courseObj?.fee) || 15000;
      feeRecordsMap.set(key, {
        _id: `temp_${enr._id}`,
        feeId: null,
        enrollmentId: enr._id,
        student: enr.studentId,
        course: courseObj,
        batchName: enr.batch?.name || getBatchName(studentId, courseId),
        totalFee,
        paidAmount: 0,
        dueAmount: totalFee,
        status: 'unpaid',
        paymentDate: null,
        createdAt: enr.createdAt,
        updatedAt: enr.updatedAt,
        isPersisted: false,
      });
    }
  });

  const feeRecords = Array.from(feeRecordsMap.values());

  // Aggregate Calculations
  const totalReceivable = feeRecords.reduce((sum, r) => sum + r.totalFee, 0);
  const totalPaid = feeRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalDue = feeRecords.reduce((sum, r) => sum + r.dueAmount, 0);
  const collectionRate = totalReceivable > 0 ? Math.round((totalPaid / totalReceivable) * 100) : 0;

  // Filtered fee records
  const filteredRecords = feeRecords.filter((r) => {
    const studentName = r.student?.name || '';
    const courseName = r.course?.name || '';
    const matchesSearch =
      studentName.toLowerCase().includes(search.toLowerCase()) ||
      courseName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Mutations
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ record, amount }) => {
      if (record.isPersisted && record.feeId) {
        return await feesApi.recordPayment(record.feeId, amount);
      } else {
        // Create fee record with the initial payment
        const studentId = record.student?._id || record.student;
        const courseId = record.course?._id || record.course;
        return await feesApi.createFee({
          studentId,
          courseId,
          totalFee: record.totalFee,
          paidAmount: amount,
        });
      }
    },
    onSuccess: (_, variables) => {
      notify.success(`Payment of ${formatCurrency(variables.amount)} recorded for ${variables.record.student?.name || 'student'}`);
      // Clear and reset form state
      setRowPaymentAmount('');
      setRowPaymentRemarks('');
      setRowPaymentMethod('Cash');
      setRecordingPayment(null);
      // Immediately refetch queries
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to record payment');
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: async ({ record, amount }) => {
      if (record.isPersisted && record.feeId) {
        return await feesApi.recordPayment(record.feeId, amount);
      } else {
        const studentId = record.student?._id || record.student;
        const courseId = record.course?._id || record.course;
        return await feesApi.createFee({
          studentId,
          courseId,
          totalFee: record.totalFee,
          paidAmount: amount,
        });
      }
    },
    onSuccess: (_, variables) => {
      notify.success(`Collected ${formatCurrency(variables.amount)} from ${variables.record.student?.name || 'student'}`);
      // Reset form
      setSelectedTargetId('');
      setAddPaymentAmount('');
      setAddPaymentRemarks('');
      setAddPaymentMethod('Cash');
      setIsAddFeeOpen(false);
      // Immediately refetch queries
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to collect payment');
    },
  });

  const adjustFeeMutation = useMutation({
    mutationFn: async ({ record, newTotalFee }) => {
      if (record.isPersisted && record.feeId) {
        return await feesApi.updateFee(record.feeId, { totalFee: newTotalFee });
      } else {
        const studentId = record.student?._id || record.student;
        const courseId = record.course?._id || record.course;
        return await feesApi.createFee({
          studentId,
          courseId,
          totalFee: newTotalFee,
          paidAmount: 0,
        });
      }
    },
    onSuccess: (_, variables) => {
      notify.success(`Total fee adjusted to ${formatCurrency(variables.newTotalFee)} for ${variables.record.student?.name || 'student'}`);
      setCustomTotalFee('');
      setAdjustReason('');
      setAdjustingFeeRecord(null);
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
    onError: (err) => {
      notify.error(err.message || 'Failed to adjust fee');
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="capitalize text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'partial':
        return <Badge variant="warning" className="capitalize text-[11px]"><AlertCircle className="h-3 w-3 mr-1" /> Partial</Badge>;
      case 'unpaid':
        return <Badge variant="destructive" className="capitalize text-[11px]"><X className="h-3 w-3 mr-1" /> Unpaid</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px] capitalize">{status}</Badge>;
    }
  };

  // Open Record Payment Modal for Row
  const handleOpenPaymentModal = (record) => {
    setRecordingPayment(record);
    setRowPaymentAmount('');
    setRowPaymentMethod('Cash');
    setRowPaymentDate(new Date().toISOString().split('T')[0]);
    setRowPaymentRemarks('');
  };

  // Handle Save Row Payment
  const handleSaveRowPayment = (e) => {
    e.preventDefault();
    if (!recordingPayment) return;
    const amount = Number(rowPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error('Please enter a valid payment amount greater than 0');
      return;
    }
    if (amount > recordingPayment.dueAmount) {
      notify.error(`Payment amount cannot exceed remaining due (${formatCurrency(recordingPayment.dueAmount)})`);
      return;
    }

    recordPaymentMutation.mutate({
      record: recordingPayment,
      amount,
    });
  };

  // Handle Add Fee Payment Submit (from Top Modal)
  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    const targetRecord = feeRecords.find((r) => r._id === selectedTargetId);
    if (!targetRecord) {
      notify.error('Please select an enrolled student');
      return;
    }

    const amount = Number(addPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      notify.error('Please enter a valid payment amount greater than 0');
      return;
    }

    if (amount > targetRecord.dueAmount) {
      notify.error(`Payment exceeds remaining due amount (${formatCurrency(targetRecord.dueAmount)})`);
      return;
    }

    addPaymentMutation.mutate({
      record: targetRecord,
      amount,
    });
  };

  // Handle Adjust Total Fee Submit
  const handleSaveFeeAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingFeeRecord) return;
    const newFee = Number(customTotalFee);
    if (isNaN(newFee) || newFee < 0) {
      notify.error('Please enter a valid course fee amount');
      return;
    }
    if (newFee < adjustingFeeRecord.paidAmount) {
      notify.error(`Total fee cannot be lower than the amount already paid (${formatCurrency(adjustingFeeRecord.paidAmount)})`);
      return;
    }

    adjustFeeMutation.mutate({
      record: adjustingFeeRecord,
      newTotalFee: newFee,
    });
  };

  const selectedTargetForAdd = feeRecords.find((r) => r._id === selectedTargetId);
  const isLoading = feesLoading || enrollmentsLoading || coursesLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Student Fee Records & Receivables</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track total student receivables, fee collections, outstanding balances, and record payments.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => {
              setIsAddFeeOpen(true);
              setSelectedTargetId('');
              setAddPaymentDate(new Date().toISOString().split('T')[0]);
              setAddPaymentAmount('');
              setAddPaymentRemarks('');
            }}
            className="font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Collect / Add Fee Payment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL STUDENT RECEIVABLE */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Student Receivable</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '--' : formatCurrency(totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total tuition fees across enrolled students</p>
          </CardContent>
        </Card>

        {/* TOTAL PAID / COLLECTED */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Paid / Collected</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {isLoading ? '--' : formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fee payments received to date</p>
          </CardContent>
        </Card>

        {/* TOTAL DUE AMOUNT */}
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Total Due Amount</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {isLoading ? '--' : formatCurrency(totalDue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total outstanding student balance</p>
          </CardContent>
        </Card>

        {/* COLLECTION RATE */}
        <Card className="border shadow-sm bg-gradient-to-br from-primary/5 via-card to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">Collection Rate</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{isLoading ? '--%' : `${collectionRate}%`}</div>
            <p className="text-xs text-muted-foreground mt-1">Institute fee recovery rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-9"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
          {['all', 'paid', 'partial', 'unpaid'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="text-xs h-8 capitalize whitespace-nowrap"
            >
              {status === 'all' ? 'All Records' : status}
            </Button>
          ))}
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <LoadingSpinner text="Loading fee ledger and student records..." />
      ) : feesIsError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {feesError?.message || 'Error loading student fee records'}
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No Fee Records Found"
          description={search ? 'No records match "' + search + '"' : 'No enrolled student fee records available.'}
          action={
            <Button size="sm" variant="outline" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
              Reset Filters
            </Button>
          }
        />
      ) : (
        /* Enrolled Students Fee Table */
        <Card className="overflow-hidden border shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Enrolled Student</th>
                  <th className="py-3 px-4">Course & Batch</th>
                  <th className="py-3 px-4">Total Fee</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Due Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-muted/20 transition-colors">
                    {/* Student Info with Navigation */}
                    <td className="py-3 px-4 font-semibold text-foreground flex items-center space-x-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => r.student?._id && navigate('/admin/users/' + r.student._id)}
                      >
                        {getInitials(r.student?.name || 'Student')}
                      </div>
                      <div>
                        <span
                          className="hover:text-primary hover:underline cursor-pointer transition-colors block"
                          onClick={() => r.student?._id && navigate('/admin/users/' + r.student._id)}
                        >
                          {r.student?.name || 'Unknown Student'}
                        </span>
                        <p className="text-[11px] font-normal text-muted-foreground">{r.student?.email}</p>
                      </div>
                    </td>

                    {/* Course & Batch */}
                    <td className="py-3 px-4 font-medium">
                      <span>{r.course?.name || 'Course'}</span>
                      <p className="text-[11px] text-muted-foreground font-normal">{r.batchName}</p>
                    </td>

                    {/* Total Fee (with edit discount option) */}
                    <td className="py-3 px-4 font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{formatCurrency(r.totalFee)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          title="Adjust Total Fee / Scholarship"
                          onClick={() => {
                            setAdjustingFeeRecord(r);
                            setCustomTotalFee(String(r.totalFee));
                            setAdjustReason('');
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(r.paidAmount)}
                    </td>

                    {/* Due Amount */}
                    <td className="py-3 px-4 font-bold text-destructive">
                      {formatCurrency(r.dueAmount)}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">{getStatusBadge(r.status)}</td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={r.dueAmount === 0}
                          className="h-8 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                          onClick={() => handleOpenPaymentModal(r)}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1" /> Record Payment
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="View Receipt"
                          onClick={() => setViewingReceipt(r)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌟 1. COLLECT / ADD FEE PAYMENT MODAL (FROM TOP BUTTON) 🌟 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isAddFeeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center">
                <Wallet className="h-4 w-4 mr-2 text-primary" /> Collect / Add Student Fee Payment
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsAddFeeOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleAddFeeSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Select Enrolled Student */}
              <div className="space-y-1.5">
                <label className="font-medium">Select Enrolled Student</label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  required
                >
                  <option value="">Choose Student & Course...</option>
                  {feeRecords.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.student?.name} — {r.course?.name} ({r.batchName}) — Due: {formatCurrency(r.dueAmount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Summary if Selected */}
              {selectedTargetForAdd && (
                <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Program:</span>
                    <span className="font-semibold">{selectedTargetForAdd.course?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Fee:</span>
                    <span className="font-bold">{formatCurrency(selectedTargetForAdd.totalFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(selectedTargetForAdd.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-1">
                    <span className="text-muted-foreground">Outstanding Due:</span>
                    <span className="font-bold text-destructive">{formatCurrency(selectedTargetForAdd.dueAmount)}</span>
                  </div>
                </div>
              )}

              {/* Payment Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium">Payment Amount (NPR / Rs.)</label>
                  <Input
                    type="number"
                    min="1"
                    max={selectedTargetForAdd ? selectedTargetForAdd.dueAmount : undefined}
                    placeholder="Enter amount to pay"
                    value={addPaymentAmount}
                    onChange={(e) => setAddPaymentAmount(e.target.value)}
                    disabled={addPaymentMutation.isPending}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium">Payment Mode</label>
                  <select
                    value={addPaymentMethod}
                    onChange={(e) => setAddPaymentMethod(e.target.value)}
                    disabled={addPaymentMutation.isPending}
                    className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Payment Date & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium">Payment Date</label>
                  <Input
                    type="date"
                    value={addPaymentDate}
                    onChange={(e) => setAddPaymentDate(e.target.value)}
                    disabled={addPaymentMutation.isPending}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium">Receipt Remarks / Ref</label>
                  <Input
                    placeholder="e.g. Installment 1 / Txn ID"
                    value={addPaymentRemarks}
                    onChange={(e) => setAddPaymentRemarks(e.target.value)}
                    disabled={addPaymentMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddFeeOpen(false)}
                  disabled={addPaymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addPaymentMutation.isPending}>
                  {addPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Recording...
                    </>
                  ) : (
                    'Save Fee Payment'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌟 2. RECORD / UPDATE PAYMENT MODAL (PER ROW) 🌟 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {recordingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-primary" /> Record Student Fee Payment
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Student: <span className="font-semibold text-foreground">{recordingPayment.student?.name}</span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRecordingPayment(null)}
                disabled={recordPaymentMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveRowPayment} className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1.5 border text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course Program:</span>
                  <span className="font-semibold">{recordingPayment.course?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Course Fee:</span>
                  <span className="font-bold">{formatCurrency(recordingPayment.totalFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Amount Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(recordingPayment.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-muted-foreground">Current Outstanding Due:</span>
                  <span className="font-bold text-destructive">{formatCurrency(recordingPayment.dueAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium">Payment Amount (NPR)</label>
                  <Input
                    type="number"
                    min="1"
                    max={recordingPayment.dueAmount}
                    placeholder={`Max ${recordingPayment.dueAmount}`}
                    value={rowPaymentAmount}
                    onChange={(e) => setRowPaymentAmount(e.target.value)}
                    disabled={recordPaymentMutation.isPending}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium">Payment Mode</label>
                  <select
                    value={rowPaymentMethod}
                    onChange={(e) => setRowPaymentMethod(e.target.value)}
                    disabled={recordPaymentMutation.isPending}
                    className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  >
                    <option value="Cash">Cash</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium">Payment Date</label>
                  <Input
                    type="date"
                    value={rowPaymentDate}
                    onChange={(e) => setRowPaymentDate(e.target.value)}
                    disabled={recordPaymentMutation.isPending}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium">Remarks / Ref</label>
                  <Input
                    placeholder="e.g. Receipt #1024"
                    value={rowPaymentRemarks}
                    onChange={(e) => setRowPaymentRemarks(e.target.value)}
                    disabled={recordPaymentMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRecordingPayment(null)}
                  disabled={recordPaymentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={recordPaymentMutation.isPending}>
                  {recordPaymentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Recording...
                    </>
                  ) : (
                    'Save Fee Record'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌟 3. ADJUST TOTAL FEE / SCHOLARSHIP MODAL 🌟 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {adjustingFeeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold flex items-center">
                <Edit2 className="h-4 w-4 mr-2 text-primary" /> Adjust Fee / Apply Scholarship
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAdjustingFeeRecord(null)}
                disabled={adjustFeeMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveFeeAdjustment} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-muted-foreground">
                Set custom total tuition fee for <strong className="text-foreground">{adjustingFeeRecord.student?.name}</strong> in {adjustingFeeRecord.course?.name}.
              </p>

              <div className="space-y-1.5">
                <label className="font-medium">Custom Total Course Fee (NPR / Rs.)</label>
                <Input
                  type="number"
                  min={adjustingFeeRecord.paidAmount}
                  placeholder="e.g. 12000"
                  value={customTotalFee}
                  onChange={(e) => setCustomTotalFee(e.target.value)}
                  disabled={adjustFeeMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium">Reason / Scholarship Tag</label>
                <Input
                  placeholder="e.g. 20% Merit Scholarship / Early Bird"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  disabled={adjustFeeMutation.isPending}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustingFeeRecord(null)}
                  disabled={adjustFeeMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={adjustFeeMutation.isPending}>
                  {adjustFeeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Custom Fee'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 🌟 4. VIEW / PRINT PAYMENT RECEIPT MODAL 🌟 */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl border p-6 space-y-4 bg-card">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Academix Official Fee Receipt</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingReceipt(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 rounded-xl border bg-muted/20 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b pb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Student Name:</p>
                  <p className="font-bold text-sm text-foreground">{viewingReceipt.student?.name}</p>
                  <p className="text-[11px] text-muted-foreground">{viewingReceipt.student?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Payment Date:</p>
                  <p className="font-semibold text-foreground">
                    {viewingReceipt.paymentDate ? formatDate(viewingReceipt.paymentDate) : 'N/A'}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">{viewingReceipt.status}</Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course Program:</span>
                  <span className="font-semibold">{viewingReceipt.course?.name} ({viewingReceipt.course?.code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Schedule:</span>
                  <span>{viewingReceipt.batchName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Course Fee:</span>
                  <span className="font-bold">{formatCurrency(viewingReceipt.totalFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid to Date:</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(viewingReceipt.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5">
                  <span className="font-semibold">Remaining Due Amount:</span>
                  <span className="font-bold text-destructive">{formatCurrency(viewingReceipt.dueAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant={viewingReceipt.status === 'paid' ? 'success' : viewingReceipt.status === 'partial' ? 'warning' : 'destructive'} className="capitalize">
                Status: {viewingReceipt.status}
              </Badge>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5 mr-1" /> Print Receipt
                </Button>
                <Button size="sm" onClick={() => setViewingReceipt(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Fees;
