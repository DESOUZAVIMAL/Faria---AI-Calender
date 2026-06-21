import React, { useState } from "react";
import { TeammateRow } from "../types";
import { 
  Users, 
  MapPin, 
  Plus, 
  Trash2, 
  Settings, 
  Filter, 
  MinusCircle, 
  PlusCircle, 
  Sparkles,
  Info,
  Search,
  Download,
  Loader2
} from "lucide-react";
import { DateTime } from "luxon";
import { motion } from "motion/react";

interface PeopleSelectorProps {
  people: TeammateRow[];
  selectedIds: string[];
  onTogglePerson: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  preferences: {
    muted_titles: string[];
    only_accepted: boolean;
    hide_optional: boolean;
    working_hours_only: boolean;
    broadcast_threshold: number;
  };
  onUpdatePrefs: (prefs: any) => void;
  onAddRosterPerson: (person: { name: string; email: string; timezone: string; role: "manager" | "team" }) => void;
  onDeletePerson: (id: string) => void;
}

export default function PeopleSelector({
  people,
  selectedIds,
  onTogglePerson,
  onSelectAll,
  onSelectNone,
  preferences,
  onUpdatePrefs,
  onAddRosterPerson,
  onDeletePerson,
}: PeopleSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTz, setNewTz] = useState("America/New_York");
  const [newRole, setNewRole] = useState<"manager" | "team">("team");
  
  const [addTab, setAddTab] = useState<"manual" | "google">("manual");
  const [googleContacts, setGoogleContacts] = useState<Array<{ id: string; name: string; email: string; timezone: string }>>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [selectedContactTzs, setSelectedContactTzs] = useState<Record<string, string>>({});
  const [importedEmails, setImportedEmails] = useState<string[]>([]);

  const fetchGoogleContacts = () => {
    setLoadingContacts(true);
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        setGoogleContacts(data || []);
        const mapped: Record<string, string> = {};
        (data || []).forEach((c: any) => {
          mapped[c.id] = c.timezone || "America/New_York";
        });
        setSelectedContactTzs(mapped);
        setLoadingContacts(false);
      })
      .catch((err) => {
        console.error("Failed to fetch Google contacts:", err);
        setLoadingContacts(false);
      });
  };

  const handleImportContact = (contact: { id: string; name: string; email: string }, role: "manager" | "team") => {
    const tz = selectedContactTzs[contact.id] || "America/New_York";
    onAddRosterPerson({
      name: contact.name,
      email: contact.email,
      timezone: tz,
      role,
    });
    setImportedEmails(prev => [...prev, contact.email]);
  };

  // Keep a small list of popular IANA timezones
  const POPULAR_TIMEZONES = [
    "UTC",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "Europe/London",
    "Europe/Paris",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  // Live checker for local hour and status dot
  const getTeammateClockClass = (tz: string) => {
    try {
      const dt = DateTime.local().setZone(tz);
      const hr = dt.hour;
      // standard office working hours
      if (hr >= 9 && hr < 17) {
        return { text: dt.toFormat("hh:mm a"), dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" };
      } else if ((hr >= 7 && hr < 9) || (hr >= 17 && hr < 21)) {
        return { text: dt.toFormat("hh:mm a"), dot: "bg-amber-400" };
      }
      return { text: dt.toFormat("hh:mm a"), dot: "bg-red-400" };
    } catch {
      return { text: "--:--", dot: "bg-slate-400" };
    }
  };

  const currentHourOfUser = (tz: string): string => {
    try {
      return DateTime.local().setZone(tz).toFormat("hh:mm a");
    } catch {
      return "";
    }
  };

  // Group teammates
  const youPerson = people.find((p) => p.role === "you");
  const managerPeople = people.filter((p) => p.role === "manager");
  const teamPeople = people.filter((p) => p.role === "team");

  const handleSubmitNewPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newTz) return;
    onAddRosterPerson({
      name: newName,
      email: newEmail,
      timezone: newTz,
      role: newRole,
    });
    setNewName("");
    setNewEmail("");
    setShowAddModal(false);
  };

  const [termInput, setTermInput] = useState("");

  const handleAddMutedTerm = () => {
    if (!termInput.trim()) return;
    const current = preferences.muted_titles || [];
    if (!current.includes(termInput.trim())) {
      onUpdatePrefs({ muted_titles: [...current, termInput.trim()] });
    }
    setTermInput("");
  };

  const handleRemoveMutedTerm = (term: string) => {
    const current = preferences.muted_titles || [];
    onUpdatePrefs({ muted_titles: current.filter((t) => t !== term) });
  };

  // Render a teammate row
  const renderTeammateRow = (person: TeammateRow) => {
    const isSelected = selectedIds.includes(person.id);
    const clock = getTeammateClockClass(person.timezone);
    const initials = person.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <motion.div
        key={person.id}
        whileHover={{ x: 2, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-200 group ${
          isSelected
            ? "bg-slate-800/40 border-white/10 hover:bg-slate-800/60 shadow-[0_2px_8px_rgba(109,139,255,0.05)]"
            : "bg-transparent border-transparent opacity-50 hover:opacity-85"
        }`}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`chk-${person.id}`}
            checked={isSelected}
            onChange={() => onTogglePerson(person.id)}
            className="w-4.5 h-4.5 rounded border-[#6B779C] text-[#6D8BFF] focus:ring-[#6D8BFF] cursor-pointer accent-[#6D8BFF]"
          />
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-[#6D8BFF]/10 border border-[#6D8BFF]/20 flex items-center justify-center text-[#EAF0FF] text-xs font-bold leading-none">
              {initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#070A14] ${clock.dot}`} />
          </div>
          <div>
            <span className="text-sm font-medium text-[#EAF0FF] block leading-none">
              {person.name}
            </span>
            <span className="text-[10px] text-[#6B779C] flex items-center gap-1 mt-1 font-mono">
              <MapPin className="h-2.5 w-2.5" />
              {person.timezone} ({clock.text})
            </span>
          </div>
        </div>

        {person.role !== "you" && (
          <button
            onClick={() => onDeletePerson(person.id)}
            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Delete Teammate"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header selectors & Bulk Selection */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-[#6D8BFF]" />
            <h3 className="font-display text-sm font-semibold text-[#EAF0FF]">
              Teammate Roster
            </h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 text-[11px] font-medium bg-[#6D8BFF]/10 text-[#6D8BFF] hover:bg-[#6D8BFF]/25 border border-[#6D8BFF]/30 px-2.5 py-1 rounded-xl transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Toggle Add
          </button>
        </div>

        {/* Bulk select triggers */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-[#AEB9D6] mb-4.5">
          <button
            onClick={onSelectAll}
            className="py-1.5 text-center bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
          >
            Select All
          </button>
          <button
            onClick={onSelectNone}
            className="py-1.5 text-center bg-white/5 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
          >
            Deselect All
          </button>
        </div>

        {/* Group lists with grid */}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {youPerson && (
            <div className="space-y-1.5">
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#6B779C] block px-1">
                You
              </span>
              {renderTeammateRow(youPerson)}
            </div>
          )}

          {managerPeople.length > 0 && (
            <div className="space-y-1.5 group">
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#6B779C] block px-1">
                Manager
              </span>
              <div className="space-y-1.5">
                {managerPeople.map((person) => renderTeammateRow(person))}
              </div>
            </div>
          )}

          {teamPeople.length > 0 && (
            <div className="space-y-1.5 group">
              <span className="text-[10px] tracking-wider uppercase font-bold text-[#6B779C] block px-1">
                Colleagues & Teammates
              </span>
              <div className="space-y-1.5">
                {teamPeople.map((person) => renderTeammateRow(person))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive Availability Color Legend */}
      <div className="glass-panel rounded-2xl p-4.5">
        <h4 className="font-display text-xs font-semibold text-[#EAF0FF] mb-3">
          Conflict & Free Legend
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#34D399]/5 border border-[#34D399]/15">
            <span className="w-2.5 h-2.5 rounded bg-[#34D399]" />
            <span className="text-[11px] text-[#AEB9D6]">Level 0: Free</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#5EEAD4]/5 border border-[#5EEAD4]/15">
            <span className="w-2.5 h-2.5 rounded bg-[#5EEAD4]" />
            <span className="text-[11px] text-[#AEB9D6]">Level 1: Likely Free</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FBBF24]/5 border border-[#FBBF24]/15">
            <span className="w-2.5 h-2.5 rounded bg-[#FBBF24]" />
            <span className="text-[11px] text-[#AEB9D6]">Level 2: Tentative</span>
          </div>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#FB7185]/5 border border-[#FB7185]/15">
            <span className="w-2.5 h-2.5 rounded bg-[#FB7185]" />
            <span className="text-[11px] text-[#AEB9D6]">Level 3: Busy / Off</span>
          </div>
        </div>
      </div>

      {/* 3. Global Filters & Calendar Rules */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
          <Filter className="h-4 w-4 text-[#A78BFA]" />
          <h4 className="font-display text-xs font-semibold text-[#EAF0FF]">
            Calendar Noise Filtration
          </h4>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] text-[#AEB9D6] group-hover:text-[#EAF0FF] transition-colors">
              Only accepted meetings block
            </span>
            <input
              type="checkbox"
              checked={preferences.only_accepted}
              onChange={(e) => onUpdatePrefs({ only_accepted: e.target.checked })}
              className="sr-only peer"
            />
            <div className="relative w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] text-[#AEB9D6] group-hover:text-[#EAF0FF] transition-colors">
              Hide optional invitations
            </span>
            <input
              type="checkbox"
              checked={preferences.hide_optional}
              onChange={(e) => onUpdatePrefs({ hide_optional: e.target.checked })}
              className="sr-only peer"
            />
            <div className="relative w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#6D8BFF]"></div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-[11px] text-[#AEB9D6] group-hover:text-[#EAF0FF] transition-colors">
              Show Working Hours Only
            </span>
            <input
              type="checkbox"
              checked={preferences.working_hours_only}
              onChange={(e) => onUpdatePrefs({ working_hours_only: e.target.checked })}
              className="sr-only peer"
            />
            <div className="relative w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-500"></div>
          </label>
        </div>

        {/* Broadcast limit threshold */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] text-[#AEB9D6] mb-1.5">
            <span>Broadcast threshold (unblocks)</span>
            <span className="font-mono font-medium text-[#EAF0FF]">{preferences.broadcast_threshold}+ guests</span>
          </div>
          <input
            type="range"
            min="5"
            max="40"
            step="5"
            value={preferences.broadcast_threshold}
            onChange={(e) => onUpdatePrefs({ broadcast_threshold: parseInt(e.target.value, 10) })}
            className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Custom Muted string rule */}
        <div className="pt-3 border-t border-white/5 space-y-2">
          <span className="text-[10px] tracking-wider uppercase font-bold text-[#6B779C] block">
            Title Muted Filters
          </span>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. Focus"
              value={termInput}
              onChange={(e) => setTermInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddMutedTerm();
              }}
              className="flex-1 bg-slate-900/60 border border-white/5 text-[#EAF0FF] text-[11px] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#6D8BFF]/45"
            />
            <button
              onClick={handleAddMutedTerm}
              className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 font-medium rounded-xl border border-white/5 text-[#EAF0FF]"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto no-scrollbar">
            {(preferences.muted_titles || []).map((term) => (
              <span
                key={term}
                className="inline-flex items-center gap-1 bg-slate-900/80 border border-white/10 text-slate-350 text-[10px] px-2 py-0.5 rounded-full"
              >
                {term}
                <button
                  onClick={() => handleRemoveMutedTerm(term)}
                  className="text-red-400 hover:text-red-300 font-bold ml-0.5 leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Add Teammate Overlay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#070A14]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md border border-white/10 bg-[#141b30]/95 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="font-display text-base font-semibold text-[#EAF0FF] mb-3 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              Add Remote Teammate
            </h3>

            {/* Tabs for Manual vs Google Contacts */}
            <div className="flex border-b border-white/10 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setAddTab("manual")}
                className={`flex-1 pb-2 border-b-2 transition-all ${addTab === "manual" ? "border-indigo-500 text-[#EAF0FF]" : "border-transparent text-slate-500 hover:text-[#AEB9D6]"}`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddTab("google");
                  fetchGoogleContacts();
                }}
                className={`flex-1 pb-2 border-b-2 transition-all ${addTab === "google" ? "border-indigo-500 text-[#EAF0FF]" : "border-transparent text-slate-500 hover:text-[#AEB9D6]"}`}
              >
                Import Google Contacts
              </button>
            </div>

            {addTab === "manual" ? (
              <form onSubmit={handleSubmitNewPerson} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#6B779C] mb-1.5">
                    Teammate Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Patel"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#6D8BFF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#6B779C] mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="liam.patel@fariaedu.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#6D8BFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B779C] mb-1.5">
                      Timezone
                    </label>
                    <select
                      value={newTz}
                      onChange={(e) => setNewTz(e.target.value)}
                      className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[#6D8BFF] font-mono"
                    >
                      {POPULAR_TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#6B779C] mb-1.5">
                      Role Category
                    </label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as any)}
                      className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[#6D8BFF]"
                    >
                      <option value="team">Team Member</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#EAF0FF] text-xs font-medium px-4 py-2 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-650 hover:to-purple-650 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_12px_rgba(109,139,255,0.3)]"
                  >
                    Save Teammate
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchContact}
                    onChange={(e) => setSearchContact(e.target.value)}
                    className="w-full bg-[#070A14] border border-white/10 text-[#EAF0FF] rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#6D8BFF]"
                  />
                </div>

                {loadingContacts ? (
                  <div className="flex flex-col items-center justify-center py-8 text-xs text-slate-500">
                    <Loader2 className="h-6 w-6 text-indigo-400 animate-spin mb-2" />
                    <span>Fetching Google Contacts...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                      {googleContacts
                        .filter(c =>
                          c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
                          c.email.toLowerCase().includes(searchContact.toLowerCase())
                        )
                        .map(contact => {
                          const isAlreadyInRoster = people.some(p => p.email.toLowerCase() === contact.email.toLowerCase());
                          const isImported = importedEmails.includes(contact.email) || isAlreadyInRoster;
                          const currentTz = selectedContactTzs[contact.id] || "America/New_York";

                          return (
                            <div key={contact.id} className="p-2.5 rounded-xl border border-white/5 bg-slate-900/30 hover:bg-slate-950/40 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-semibold text-[#EAF0FF] block leading-none">{contact.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{contact.email}</span>
                                </div>
                                {isImported ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-lg">
                                    Added
                                  </span>
                                ) : (
                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleImportContact(contact, "team")}
                                      className="flex items-center gap-1 text-[10px] font-semibold bg-[#6D8BFF]/15 text-[#6D8BFF] border border-[#6D8BFF]/25 hover:bg-[#6D8BFF]/25 px-2 py-1 rounded-lg transition-all"
                                      title="Add as Team Colleague"
                                    >
                                      + Colleague
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleImportContact(contact, "manager")}
                                      className="flex items-center gap-1 text-[10px] font-semibold bg-[#A78BFA]/15 text-[#A78BFA] border border-[#A78BFA]/25 hover:bg-[#A78BFA]/25 px-2 py-1 rounded-lg transition-all"
                                      title="Add as Manager"
                                    >
                                      + Manager
                                    </button>
                                  </div>
                                )}
                              </div>
                              {!isImported && (
                                <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1.5">
                                  <span className="text-[9px] text-[#6B779C] uppercase font-bold">Timezone</span>
                                  <select
                                    value={currentTz}
                                    onChange={(e) => setSelectedContactTzs(prev => ({ ...prev, [contact.id]: e.target.value }))}
                                    className="bg-[#070A14] border border-white/5 text-[#EAF0FF] rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-[#6D8BFF] font-mono w-[160px]"
                                  >
                                    {POPULAR_TIMEZONES.map(tz => (
                                      <option key={tz} value={tz}>{tz}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {googleContacts.filter(c =>
                        c.name.toLowerCase().includes(searchContact.toLowerCase()) ||
                        c.email.toLowerCase().includes(searchContact.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-6 text-xs text-slate-500">
                          No matching Google contacts found.
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-[#EAF0FF] text-xs font-semibold px-4 py-2 rounded-xl transition-all w-full"
                      >
                        Done Importing
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
