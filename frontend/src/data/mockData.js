export const TODAY = new Date("2026-10-23");

export const BUREAUS = ["RB", "PGRC", "Approval Bureau", "Regional Office"];
export const STATUSES = ["Pending", "Under Process", "Disposed", "Transferred", "Escalated"];
export const REGIONS = ["Northern", "Southern", "Eastern", "Western", "Central"];
export const CATEGORIES = [
  "Fee Refund",
  "Faculty Qualification",
  "Infrastructure",
  "Admission Irregularity",
  "Unapproved Course",
  "Placement Misrepresentation",
  "Certificate Issue",
  "Approval Delay",
];

export const institutions = [
  { id: "1-2345678901", name: "Sri Venkateswara Institute of Technology", city: "Pune", state: "Maharashtra", region: "Western", type: "Private", intake: 1200, established: 1998, address: "NH-48, Hinjewadi, Pune - 411057" },
  { id: "1-2345678902", name: "Lakshmi College of Engineering", city: "Chennai", state: "Tamil Nadu", region: "Southern", type: "Private", intake: 960, established: 2004, address: "OMR Road, Sholinganallur, Chennai - 600119" },
  { id: "1-2345678903", name: "Gurukul Institute of Management & Technology", city: "Jaipur", state: "Rajasthan", region: "Northern", type: "Private", intake: 600, established: 2009, address: "Tonk Road, Jaipur - 302022" },
  { id: "1-2345678904", name: "Eastern Institute of Technology", city: "Kolkata", state: "West Bengal", region: "Eastern", type: "Private", intake: 780, established: 2001, address: "Salt Lake Sector V, Kolkata - 700091" },
  { id: "1-2345678905", name: "Himalayan College of Engineering", city: "Dehradun", state: "Uttarakhand", region: "Northern", type: "Private", intake: 540, established: 2011, address: "Rajpur Road, Dehradun - 248001" },
  { id: "1-2345678906", name: "Deccan Polytechnic", city: "Hyderabad", state: "Telangana", region: "Southern", type: "Government Aided", intake: 420, established: 1985, address: "Gachibowli, Hyderabad - 500032" },
  { id: "1-2345678907", name: "Narmada Institute of Engineering", city: "Bhopal", state: "Madhya Pradesh", region: "Central", type: "Private", intake: 720, established: 2007, address: "Kolar Road, Bhopal - 462042" },
];

export const cases = [
  { id: "CMP-2026-0101", institutionId: "1-2345678901", category: "Fee Refund", source: "Student", receivedDate: "2026-08-12", status: "Under Process", bureau: "PGRC", officer: "Mr. R. Sharma", lastAction: "Notice sent to institution", lastActionDate: "2026-10-05", nextAction: "Await institution reply", dueDate: "2026-11-12", description: "Student reports that refund of admission fee was not processed after withdrawal." },
  { id: "CMP-2026-0102", institutionId: "1-2345678901", category: "Faculty Qualification", source: "Faculty", receivedDate: "2026-09-03", status: "Under Process", bureau: "RB", officer: "Ms. A. Iyer", lastAction: "Faculty records requested", lastActionDate: "2026-10-10", nextAction: "Verify submitted records", dueDate: "2026-11-20", description: "Faculty member alleges several lecturers do not meet AICTE qualification norms." },
  { id: "CMP-2026-0103", institutionId: "1-2345678901", category: "Faculty Qualification", source: "Student", receivedDate: "2026-10-01", status: "Pending", bureau: "PGRC", officer: "Mr. R. Sharma", lastAction: "Complaint registered", lastActionDate: "2026-10-01", nextAction: "Initial scrutiny", dueDate: "2026-11-30", description: "Students complain that unqualified staff are teaching core engineering subjects." },
  { id: "CMP-2026-0104", institutionId: "1-2345678902", category: "Infrastructure", source: "Faculty", receivedDate: "2026-06-20", status: "Escalated", bureau: "RB", officer: "Dr. S. Menon", lastAction: "Escalated to Chairman office", lastActionDate: "2026-10-12", nextAction: "Competent authority decision", dueDate: "2026-09-20", description: "Laboratories and library are below the prescribed norms for approved intake." },
  { id: "CMP-2026-0105", institutionId: "1-2345678902", category: "Infrastructure", source: "Student", receivedDate: "2026-09-15", status: "Pending", bureau: "PGRC", officer: "Ms. K. Nair", lastAction: "Complaint registered", lastActionDate: "2026-09-15", nextAction: "Initial scrutiny", dueDate: "2026-10-30", description: "Students say lab equipment is unavailable and practicals are not conducted." },
  { id: "CMP-2026-0106", institutionId: "1-2345678903", category: "Admission Irregularity", source: "Parent", receivedDate: "2026-05-10", status: "Disposed", bureau: "PGRC", officer: "Mr. P. Verma", lastAction: "Closed with advisory", lastActionDate: "2026-08-02", nextAction: "None", dueDate: "2026-07-10", description: "Parent alleges admission was given outside the centralized counselling process." },
  { id: "CMP-2026-0107", institutionId: "1-2345678903", category: "Admission Irregularity", source: "Anonymous", receivedDate: "2026-07-01", status: "Transferred", bureau: "Regional Office", officer: "Mr. D. Joshi", lastAction: "Transferred to Regional Office (Northern)", lastActionDate: "2026-09-18", nextAction: "Field inspection", dueDate: "2026-11-05", description: "Admissions reported above the approved intake in two branches." },
  { id: "CMP-2026-0108", institutionId: "1-2345678904", category: "Unapproved Course", source: "Student", receivedDate: "2026-10-01", status: "Pending", bureau: "Regional Office", officer: "Mr. T. Das", lastAction: "Complaint registered", lastActionDate: "2026-10-01", nextAction: "Verify approved courses", dueDate: "2026-11-15", description: "A new data science program is being run without AICTE approval." },
  { id: "CMP-2026-0109", institutionId: "1-2345678904", category: "Unapproved Course", source: "Faculty", receivedDate: "2026-10-05", status: "Under Process", bureau: "RB", officer: "Ms. A. Iyer", lastAction: "Show-cause notice issued", lastActionDate: "2026-10-15", nextAction: "Review institution reply", dueDate: "2026-11-25", description: "Institution is admitting students to a program not listed in the approval process handbook." },
  { id: "CMP-2026-0110", institutionId: "1-2345678905", category: "Fee Refund", source: "Student", receivedDate: "2026-07-25", status: "Pending", bureau: "PGRC", officer: "Ms. K. Nair", lastAction: "Reminder sent", lastActionDate: "2026-09-10", nextAction: "Escalate if no reply", dueDate: "2026-09-25", description: "Hostel and mess fees collected are higher than the declared fee structure." },
  { id: "CMP-2026-0111", institutionId: "1-2345678906", category: "Approval Delay", source: "Faculty", receivedDate: "2026-08-30", status: "Under Process", bureau: "Approval Bureau", officer: "Dr. L. Reddy", lastAction: "Documents under verification", lastActionDate: "2026-10-14", nextAction: "Committee review", dueDate: "2026-12-01", description: "Institution reports delay in processing of its extension of approval." },
  { id: "CMP-2026-0112", institutionId: "1-2345678906", category: "Certificate Issue", source: "Student", receivedDate: "2026-06-02", status: "Disposed", bureau: "PGRC", officer: "Mr. P. Verma", lastAction: "Certificates issued, case closed", lastActionDate: "2026-07-28", nextAction: "None", dueDate: "2026-08-02", description: "Final-year student has not received the degree certificate." },
  { id: "CMP-2026-0113", institutionId: "1-2345678907", category: "Placement Misrepresentation", source: "Student", receivedDate: "2026-09-08", status: "Under Process", bureau: "PGRC", officer: "Mr. R. Sharma", lastAction: "Clarification sought", lastActionDate: "2026-10-09", nextAction: "Examine placement data", dueDate: "2026-11-18", description: "Institution advertises 100% placements which students say is false." },
  { id: "CMP-2026-0114", institutionId: "1-2345678907", category: "Placement Misrepresentation", source: "Anonymous", receivedDate: "2026-10-12", status: "Pending", bureau: "RB", officer: "Dr. S. Menon", lastAction: "Complaint registered", lastActionDate: "2026-10-12", nextAction: "Initial scrutiny", dueDate: "2026-12-10", description: "Misleading advertisements about placement and salary packages." },
];

export const overlaps = [
  { id: "OV-001", institutionId: "1-2345678901", caseIds: ["CMP-2026-0102", "CMP-2026-0103"], similarity: 91, detectedOn: "2026-10-01", status: "Pending Review", reasons: ["Same institution ID", "Same category: Faculty Qualification", "Overlapping keywords: unqualified, faculty, norms", "Different Bureaus: RB and PGRC"], differences: ["Complainant types differ (Faculty vs Student)", "Case 0102 is already under process at RB"] },
  { id: "OV-002", institutionId: "1-2345678902", caseIds: ["CMP-2026-0104", "CMP-2026-0105"], similarity: 87, detectedOn: "2026-09-15", status: "Pending Review", reasons: ["Same institution ID", "Same category: Infrastructure", "Overlapping keywords: laboratory, equipment, norms", "Different Bureaus: RB and PGRC"], differences: ["Case 0104 is already escalated", "Case 0105 raised by students"] },
  { id: "OV-003", institutionId: "1-2345678904", caseIds: ["CMP-2026-0108", "CMP-2026-0109"], similarity: 94, detectedOn: "2026-10-05", status: "Pending Review", reasons: ["Same institution ID", "Same category: Unapproved Course", "Overlapping keywords: program, approval, admitting", "Different Bureaus: Regional Office and RB"], differences: ["RB has already issued a show-cause notice"] },
  { id: "OV-004", institutionId: "1-2345678907", caseIds: ["CMP-2026-0113", "CMP-2026-0114"], similarity: 82, detectedOn: "2026-10-12", status: "Confirmed", reasons: ["Same institution ID", "Same category: Placement Misrepresentation", "Overlapping keywords: placement, advertisement, false", "Different Bureaus: PGRC and RB"], differences: ["Different complainant sources"] },
];

export const alerts = [
  { id: "AL-01", type: "Overdue", severity: "High", caseId: "CMP-2026-0104", message: "Case is 33 days beyond the prescribed timeline.", date: "2026-10-23" },
  { id: "AL-02", type: "Overdue", severity: "High", caseId: "CMP-2026-0110", message: "Case is 28 days beyond the prescribed timeline.", date: "2026-10-23" },
  { id: "AL-03", type: "Overlap", severity: "High", caseId: "CMP-2026-0108", message: "Potential overlap with CMP-2026-0109 (RB). Coordination required.", date: "2026-10-05" },
  { id: "AL-04", type: "Overlap", severity: "Medium", caseId: "CMP-2026-0103", message: "Potential overlap with CMP-2026-0102 (RB). Coordination required.", date: "2026-10-01" },
  { id: "AL-05", type: "SLA", severity: "Medium", caseId: "CMP-2026-0105", message: "Due in 7 days. No action since registration.", date: "2026-10-23" },
  { id: "AL-06", type: "Escalation", severity: "High", caseId: "CMP-2026-0104", message: "Escalated to Chairman office. Decision awaited.", date: "2026-10-12" },
  { id: "AL-07", type: "Reminder", severity: "Low", caseId: "CMP-2026-0107", message: "Field inspection by Regional Office is pending.", date: "2026-10-20" },
  { id: "AL-08", type: "SLA", severity: "Medium", caseId: "CMP-2026-0101", message: "Due in 20 days. Awaiting institution reply.", date: "2026-10-23" },
];

export const monthlyTrend = [
  { month: "May", received: 14, disposed: 6 },
  { month: "Jun", received: 18, disposed: 9 },
  { month: "Jul", received: 22, disposed: 12 },
  { month: "Aug", received: 20, disposed: 15 },
  { month: "Sep", received: 26, disposed: 17 },
  { month: "Oct", received: 24, disposed: 14 },
];

export const baseActions = (c) => [
  { date: c.receivedDate, title: "Complaint registered", by: "Complaints Desk", remarks: `Registered under ${c.category}.` },
  { date: c.receivedDate, title: `Assigned to ${c.bureau}`, by: "System (routing rule v1.2)", remarks: `Officer: ${c.officer}.` },
  ...(c.lastActionDate !== c.receivedDate
    ? [{ date: c.lastActionDate, title: c.lastAction, by: c.officer, remarks: `Next action: ${c.nextAction}.` }]
    : []),
];

export const getInstitution = (id) => institutions.find((i) => i.id === id);
export const getCase = (id) => cases.find((c) => c.id === id);

export const isOverdue = (c) =>
  c.status !== "Disposed" && new Date(c.dueDate) < TODAY;

export const daysBetween = (a, b) =>
  Math.round((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));

export const hasOverlap = (caseId) =>
  overlaps.some((o) => o.caseIds.includes(caseId));