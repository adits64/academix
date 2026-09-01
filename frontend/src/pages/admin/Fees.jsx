import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';

const STORAGE_KEY = 'academix_fee_records';

export function Fees() {
  const navigate = useNavigate();
  const notify = useNotification();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal States
  const [isAddFeeOpen, setIsAddFeeOpen] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(null);
  const [adjustingFeeRecord, setAdjustingFeeRecord] = useState(null);
  const [viewingReceipt, setViewingReceipt] = useState(null);

  // Form Fields for Add / Collect Fee Payment Modal
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRemarks, setPaymentRemarks] = useState('');

  // Form Fields for Fee Adjustment Modal
  const [customTotalFee, setCustomTotalFee] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Local storage state for fee payments & overrides
  const [feeOverrides, setFeeOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveFeeRecord = (enrollmentId, updates) => {
    const existing = feeOverrides[enrollmentId] || {};
    const updated = {
      ...feeOverrides,
      [enrollmentId]: {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    };
    setFeeOverrides(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save fee record to localStorage', e);
    }
  };

  // Fetch Enrollments
  const { data: enrollmentsData, isLoading: enrollmentsLoading, isError, error } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsApi.getAllEnrollments,
  });

  // Fetch Courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAllCourses,
  });

  const courses = coursesData?.courses || [];
  const existingCourseIds = new Set(courses.map((c) => String(c._id)));

  const rawEnrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];
  const enrollments = rawEnrollments.filter((enr) => {
    const courseId = String(enr.courseId?._id || enr.courseId || '');
    const hasValidCourse = courseId && (existingCourseIds.size === 0 || existingCourseIds.has(courseId));
    const hasValidStudent = Boolean(enr.studentId);
    return hasValidCourse && hasValidStudent && enr.courseId;
  });

  // Helper to resolve batch name
  const getBatchName = (item) => {
    if (item.batch?.name) return item.batch.name;
    if (item.batchId?.name) return item.batchId.name;
    const courseBatches = item.courseId?.batches;
    const targetId = item.batchId?._id || item.batchId || item.batch?._id || item.batch;
    if (Array.isArray(courseBatches)) {
      const found = courseBatches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    const parentCourse = courses.find((c) => c._id === (item.courseId?._id || item.courseId));
    if (parentCourse?.batches) {
      const found = parentCourse.batches.find((b) => String(b._id) === String(targetId));
      if (found?.name) return found.name;
    }
    return 'Morning Batch A';
  };

  // Compile fee data for each active enrollment
  const feeRecords = enrollments.map((enr) => {
    const course = courses.find((c) => c._id === (enr.courseId?._id || enr.courseId)) || enr.courseId;
    const override = feeOverrides[enr._id] || {};

    const totalFee = override.customTotalFee !== undefined ? Number(override.customTotalFee) : Number(course?.fee) || 15000;
    const paidAmount = Number(override.paidAmount) || 0;
    const dueAmount = Math.max(0, totalFee - paidAmount);

    let status = 'unpaid';
    if (paidAmount >= totalFee) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    return {
      enrollmentId: enr._id,
      student: enr.studentId,
      course: course,
      batchName: getBatchName(enr),
      enrollmentDate: enr.enrollmentDate,
      totalFee,
      paidAmount,
      dueAmount,
      status,
      paymentDate: override.paymentDate || enr.enrollmentDate,
      paymentMethod: override.paymentMethod || 'Cash',
      remarks: override.remarks || '',
      adjustReason: override.adjustReason || '',
      history: override.history || [],
    };
  });

  // Calculations
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success" className="capitalize text-[11px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'partial':
        return <Badge variant="warning" className="capitalize text-[11px]"><AlertCircle className="h-3 w-3 mr-1" /> Partial</Badge>;
      case 'unpaid':
        return <Badge variant="destructive" className="capitalize text-[11px]"><X className="h-3 w-3 mr-1" /> Unpaid</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  // Quick Record Payment for row
  const handleOpenPaymentModal = (record) => {
    setRecordingPayment(record);
    setPaymentAmount(record.paidAmount > 0 ? String(record.paidAmount) : '');
    setPaymentMethod(record.paymentMethod || 'Cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRemarks(record.remarks || '');
  };

  const handleSaveRowPayment = (e) => {
    e.preventDefault();
    if (!recordingPayment) return;
    const amount = Number(paymentAmount);
    if (isNaN(amount) || amount < 0) {
      notify.error('Please enter a valid payment amount');
      return;
    }
    if (amount > recordingPayment.totalFee) {
      notify.error('Amount cannot exceed total course fee (' + formatCurrency(recordingPayment.totalFee) + ')');
      return;
    }

    const newHistory = [
      ...(recordingPayment.history || []),
      {
        amount,
        date: paymentDate,
        method: paymentMethod,
        remarks: paymentRemarks,
        timestamp: new Date().toISOString(),
      },
    ];

    saveFeeRecord(recordingPayment.enrollmentId, {
      paidAmount: amount,
      paymentDate,
      paymentMethod,
      remarks: paymentRemarks,
      history: newHistory,
    });

    notify.success('Payment updated for ' + (recordingPayment.student?.name || 'student'));
    setRecordingPayment(null);
  };

  // Handle "+ Add / Collect Fee Payment" (from Top Button)
  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    const targetRecord = feeRecords.find((r) => r.enrollmentId === selectedEnrollmentId);
    if (!targetRecord) {
      notify.error('Please select an enrolled student');
      return;
    }

    const amountToAdd = Number(paymentAmount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      notify.error('Please enter a valid payment amount greater than 0');
      return;
    }

    const currentPaid = targetRecord.paidAmount;
    const newTotalPaid = currentPaid + amountToAdd;

    if (newTotalPaid > targetRecord.totalFee) {
      notify.error('Payment exceeds remaining due amount (' + formatCurrency(targetRecord.dueAmount) + ')');
      return;
    }

    const newHistory = [
      ...(targetRecord.history || []),
      {
        amount: amountToAdd,
        date: paymentDate,
        method: paymentMethod,
        remarks: paymentRemarks,
        timestamp: new Date().toISOString(),
      },
    ];

    saveFeeRecord(targetRecord.enrollmentId, {
      paidAmount: newTotalPaid,
      paymentDate,
      paymentMethod,
      remarks: paymentRemarks,
      history: newHistory,
    });

    notify.success('Collected ' + formatCurrency(amountToAdd) + ' from ' + (targetRecord.student?.name || 'student'));
    setIsAddFeeOpen(false);
    setSelectedEnrollmentId('');
    setPaymentAmount('');
    setPaymentRemarks('');
  };

  // Handle Adjust Total Fee / Discount Modal
  const handleSaveFeeAdjustment = (e) => {
    e.preventDefault();
    if (!adjustingFeeRecord) return;
    const newFee = Number(customTotalFee);
    if (isNaN(newFee) || newFee < 0) {
      notify.error('Please enter a valid course fee amount');
      return;
    }

    saveFeeRecord(adjustingFeeRecord.enrollmentId, {
      customTotalFee: newFee,
      adjustReason,
    });

    notify.success('Total fee adjusted for ' + (adjustingFeeRecord.student?.name || 'student'));
    setAdjustingFeeRecord(null);
  };

  const selectedTargetForAdd = feeRecords.find((r) => r.enrollmentId === selectedEnrollmentId);
  const isLoading = enrollmentsLoading || coursesLoading;

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
              setPaymentDate(new Date().toISOString().split('T')[0]);
              setPaymentAmount('');
              setPaymentRemarks('');
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
      ) : isError ? (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
          {error?.message || 'Error loading student fee records'}
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
                  <tr key={r.enrollmentId} className="hover:bg-muted/20 transition-colors">
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
                            setAdjustReason(r.adjustReason || '');
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {r.adjustReason && (
                        <p className="text-[10px] text-primary font-normal">{r.adjustReason}</p>
                      )}
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
                  value={selectedEnrollmentId}
                  onChange={(e) => setSelectedEnrollmentId(e.target.value)}
                  className="w-full h-10 rounded-md border bg-background px-3 text-xs sm:text-sm"
                  required
                >
                  <option value="">Choose Student & Course...</option>
                  {feeRecords.map((r) => (
                    <option key={r.enrollmentId} value={r.enrollmentId}>
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
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium">Receipt Remarks / Ref</label>
                  <Input
                    placeholder="e.g. Installment 1 / Txn ID"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFeeOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Fee Payment
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
              <Button variant="ghost" size="icon" onClick={() => setRecordingPayment(null)}>
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
                  <label className="font-medium">Total Paid Amount (NPR)</label>
                  <Input
                    type="number"
                    min="0"
                    max={recordingPayment.totalFee}
                    placeholder={'Max ' + recordingPayment.totalFee}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
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
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium">Remarks / Ref</label>
                  <Input
                    placeholder="e.g. Receipt #1024"
                    value={paymentRemarks}
                    onChange={(e) => setPaymentRemarks(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setRecordingPayment(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Fee Record
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
              <Button variant="ghost" size="icon" onClick={() => setAdjustingFeeRecord(null)}>
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
                  min="0"
                  placeholder="e.g. 12000"
                  value={customTotalFee}
                  onChange={(e) => setCustomTotalFee(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium">Reason / Scholarship Tag</label>
                <Input
                  placeholder="e.g. 20% Merit Scholarship / Early Bird"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdjustingFeeRecord(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save Custom Fee
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
                  <p className="font-semibold text-foreground">{formatDate(viewingReceipt.paymentDate)}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{viewingReceipt.paymentMethod}</Badge>
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

              {viewingReceipt.remarks && (
                <div className="border-t pt-2 text-[11px] text-muted-foreground">
                  <strong>Notes:</strong> {viewingReceipt.remarks}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant={viewingReceipt.status === 'paid' ? 'success' : 'warning'} className="capitalize">
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
