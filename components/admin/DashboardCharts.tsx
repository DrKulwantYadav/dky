"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const colors = ["#d61b26", "#165d7a", "#2f936c", "#e3a008", "#7c5cbd"];

export function DashboardCharts({ trend, sessions, sources, attendance }: { trend: { date: string; registrations: number }[]; sessions: { date: string; registrations: number }[]; sources: { name: string; value: number }[]; attendance: { name: string; value: number }[] }) {
  return <div className="admin-chart-grid">
    <article className="admin-panel wide"><h2>Registration trend</h2><p>Daily registrations</p><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Line type="monotone" dataKey="registrations" stroke="#d61b26" strokeWidth={3}/></LineChart></ResponsiveContainer></div></article>
    <article className="admin-panel"><h2>Registrations per Sunday</h2><p>Current camp sessions</p><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><BarChart data={sessions}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="registrations" fill="#d61b26" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></article>
    <article className="admin-panel"><h2>Registration source</h2><p>Marketing attribution</p><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sources} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78}>{sources.map((_, i)=><Cell key={i} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></article>
    <article className="admin-panel"><h2>Attendance</h2><p>Camp outcomes</p><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={attendance} dataKey="value" nameKey="name" innerRadius={45} outerRadius={78}>{attendance.map((_, i)=><Cell key={i} fill={colors[(i+2)%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></article>
  </div>;
}
