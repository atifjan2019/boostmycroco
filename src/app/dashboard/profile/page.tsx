'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Globe, Briefcase, MapPin, Award, Save, X, Pencil, Phone, Camera, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function getRequiredFieldsMissing(user: any) {
  const profile = user?.client_profile;
  const missing: string[] = [];
  if (!profile?.first_name) missing.push('First Name');
  if (!profile?.last_name) missing.push('Last Name');
  if (!profile?.phone) missing.push('Phone');
  if (!profile?.email_contact && !user?.email) missing.push('Email');
  if (!profile?.country) missing.push('Country');
  if (!profile?.profile_image_url) missing.push('Profile Picture');
  return missing;
}

export default function ProfileSettingsPage() {
  const { user, token, login } = useAuth();
  const profile = user?.client_profile;
  const missingRequired = getRequiredFieldsMissing(user);
  const isNewUser = missingRequired.length > 0;
  const [editing, setEditing] = useState(isNewUser);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(profile?.profile_image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    first_name: profile?.first_name || user?.name?.split(' ')[0] || '',
    last_name: profile?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
    email_contact: profile?.email_contact || user?.email || '',
    phone: profile?.phone || '',
    site_url: profile?.site_url || '',
    country: profile?.country || '',
    experience: profile?.experience || '',
    skills: profile?.skills || '',
    languages: profile?.languages || '',
    profile_image_url: profile?.profile_image_url || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to R2 via backend
    setUploadingImage(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin.boostmycroco.com';
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${apiUrl}/api/upload-profile-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setForm(f => ({ ...f, profile_image_url: data.url }));
      } else {
        alert('Failed to upload image.');
      }
    } catch {
      alert('Upload error.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    // validate required
    if (!form.first_name || !form.last_name || !form.phone || !form.email_contact || !form.country) {
      alert('Please fill in all required fields (First Name, Last Name, Phone, Email, Country).');
      return;
    }
    setSaving(true);
    setSuccessMsg('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://admin.boostmycroco.com';
      const res = await fetch(`${apiUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const userRes = await fetch(`${apiUrl}/api/user`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (userRes.ok) {
          const updatedUser = await userRes.json();
          login(token!, updatedUser);
        }
        setEditing(false);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn max-w-4xl">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Profile Settings</h1>
          <p className="text-slate-500 font-medium">Manage your personal information and developer identity.</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-primary px-6 shadow-md shadow-green-600/20 flex items-center gap-2">
            <Pencil className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            {!isNewUser && (
              <button onClick={() => setEditing(false)} className="btn btn-outline flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
            <button onClick={handleSave} disabled={saving} className="btn btn-primary px-6 shadow-md shadow-green-600/20 flex items-center gap-2 disabled:opacity-70">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {isNewUser && editing && (
        <div className="mb-6 bg-amber-50 text-amber-800 p-4 rounded-xl text-sm font-medium border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />
          <div>
            <span className="font-bold">Complete your profile to get started!</span> Fill in the required fields below before you can post requests. Missing: {missingRequired.join(', ')}.
          </div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium border border-green-100">{successMsg}</div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-8 md:p-10 border-b border-slate-100 flex flex-col md:flex-row items-center gap-6">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors relative overflow-hidden group cursor-pointer"
              >
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-primary">{form.first_name?.[0] || 'U'}</span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">First Name <span className="text-red-500">*</span></label>
                  <input name="first_name" required className="input" value={form.first_name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                  <input name="last_name" required className="input" value={form.last_name} onChange={handleChange} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-black shadow-inner overflow-hidden">
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  form.first_name?.[0] || user?.name?.[0] || 'U'
                )}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {profile ? `${profile.first_name} ${profile.last_name || ''}` : user?.name}
                </h2>
                <p className="text-slate-500 font-medium mt-1">{user?.email}</p>
              </div>
            </>
          )}
        </div>

        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Contact & Location</h3>
            <div className="space-y-5">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Contact Email <span className="text-red-500">*</span></label>
                    <input name="email_contact" type="email" required className="input" value={form.email_contact} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label>
                    <input name="phone" type="tel" required className="input" placeholder="+1 234 567 890" value={form.phone} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Country <span className="text-red-500">*</span></label>
                    <input name="country" required className="input" placeholder="e.g. Germany" value={form.country} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Website URL</label>
                    <input name="site_url" className="input" placeholder="https://..." value={form.site_url} onChange={handleChange} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Contact Email</div>
                      <div className="text-slate-500">{profile?.email_contact || user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Phone</div>
                      <div className="text-slate-500">{profile?.phone || 'Not provided'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Country</div>
                      <div className="text-slate-500">{profile?.country || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Website URL</div>
                      <div className="text-slate-500">{profile?.site_url || 'Not provided'}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Professional Details</h3>
            <div className="space-y-5">
              {editing ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Experience</label>
                    <select name="experience" className="input" value={form.experience} onChange={handleChange}>
                      <option value="">Select...</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {['JetEngine', 'Elementor', 'WooCommerce', 'Crocoblock', 'WordPress', 'PHP', 'JavaScript', 'CSS', 'JetFormBuilder', 'JetBooking', 'JetSmartFilters', 'ACF'].map(skill => {
                        const selected = form.skills.split(',').map((s: string) => s.trim()).filter(Boolean).includes(skill);
                        return (
                          <button key={skill} type="button"
                            onClick={() => {
                              const current = form.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
                              const updated = selected ? current.filter((s: string) => s !== skill) : [...current, skill];
                              setForm(f => ({ ...f, skills: updated.join(', ') }));
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                              selected 
                                ? 'bg-primary/10 border-primary text-primary' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '}{skill}
                          </button>
                        );
                      })}
                    </div>
                    <input name="skills_custom" className="input text-sm" placeholder="Add other skills (comma separated)"
                      value={form.skills.split(',').map((s: string) => s.trim()).filter((s: string) => !['JetEngine', 'Elementor', 'WooCommerce', 'Crocoblock', 'WordPress', 'PHP', 'JavaScript', 'CSS', 'JetFormBuilder', 'JetBooking', 'JetSmartFilters', 'ACF'].includes(s)).join(', ')}
                      onChange={e => {
                        const presetSkills = form.skills.split(',').map((s: string) => s.trim()).filter((s: string) => ['JetEngine', 'Elementor', 'WooCommerce', 'Crocoblock', 'WordPress', 'PHP', 'JavaScript', 'CSS', 'JetFormBuilder', 'JetBooking', 'JetSmartFilters', 'ACF'].includes(s));
                        const customSkills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setForm(f => ({ ...f, skills: [...presetSkills, ...customSkills].join(', ') }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Languages</label>
                    <input name="languages" className="input" placeholder="English, German" value={form.languages} onChange={handleChange} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Experience</div>
                      <div className="text-slate-500 capitalize">{profile?.experience?.replace('_',' ') || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Skills</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile?.skills ? profile.skills.split(',').map((skill: string, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            {skill.trim()}
                          </span>
                        )) : (
                          <span className="text-slate-500 italic">No skills listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
