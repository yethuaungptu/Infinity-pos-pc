import React, { useEffect, useState } from 'react';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'loading' | 'license' | 'login'>('loading');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trialDays, setTrialDays] = useState(0);
  const [activated, setActivated] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');

  useEffect(() => {
    const check = async () => {
      try {
        const status: any = await window.api.getLicenseStatus();
        setTrialDays(status.trialDaysRemaining);
        setActivated(status.activated);
        if (status.canLogin) {
          setStep('login');
        } else {
          setStep('license');
        }
      } catch {
        setStep('login');
      }
    };
    check();
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    try {
      const res: any = await window.api.activateLicense(licenseKey);
      if (res.ok) {
        setActivated(true);
        setStep('login');
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Activation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    setRestoreMsg('');
    try {
      const res: any = await window.api.restoreFromCloud();
      setRestoreMsg(res.message);
    } catch (err: any) {
      setRestoreMsg(err.message || 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  const handleActivateAndRestore = async () => {
    if (!activated) {
      setLoading(true);
      setError('');
      try {
        const res: any = await window.api.activateLicense(licenseKey);
        if (!res.ok) {
          setError(res.message);
          setLoading(false);
          return;
        }
        setActivated(true);
      } catch (err: any) {
        setError(err.message || 'Activation failed.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    await handleRestore();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = { username: formData.username, password: formData.password };
      const user = await window.api.login(data);
      if (user) {
        onLogin(user);
      } else {
        setError('Invalid email or password.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500">Checking...</div>
      </div>
    );
  }

  if (step === 'license') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-[420px]">
          <h2 className="text-2xl font-bold text-center mb-2">Activate License</h2>
          {trialDays === 0 ? (
            <p className="text-center text-sm text-red-600 mb-4">Your free trial has expired.</p>
          ) : (
            <p className="text-center text-sm text-gray-600 mb-4">{trialDays} trial days remaining.</p>
          )}

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">License Key</label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="Enter your license key"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleActivate}
              disabled={loading || !licenseKey}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Activating...' : 'Activate'}
            </button>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-600 mb-2">Already have data in the cloud?</p>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {restoring ? 'Restoring...' : 'Restore from Cloud'}
              </button>
              {restoreMsg && (
                <p className="mt-2 text-sm text-center text-gray-700">{restoreMsg}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-[400px]">
        <h2 className="text-2xl font-bold text-center mb-2">Login</h2>
        {!activated && (
          <p className="text-center text-xs text-gray-500 mb-4">{trialDays} trial days remaining</p>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">User Name</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="border-t pt-4 mt-6">
          <details className="group">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 select-none">
              Restore from Cloud
            </summary>
            <div className="mt-3 space-y-3">
              {!activated && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Key</label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="Enter license key"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <button
                onClick={handleActivateAndRestore}
                disabled={restoring || (!activated && !licenseKey)}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                {restoring ? 'Restoring...' : activated ? 'Restore from Cloud' : 'Activate & Restore'}
              </button>
              {restoreMsg && (
                <p className="text-sm text-center text-gray-700">{restoreMsg}</p>
              )}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
