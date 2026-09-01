import { toast } from 'sonner';

export function useNotification() {
  return {
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    info: (message, options) => toast.info(message, options),
    warning: (message, options) => toast.warning(message, options),
    promise: (promise, options) => toast.promise(promise, options),
    dismiss: (toastId) => toast.dismiss(toastId),
  };
}

export default useNotification;
