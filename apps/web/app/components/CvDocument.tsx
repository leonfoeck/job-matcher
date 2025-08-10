'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type Project = { name: string; link?: string; tech?: string; description?: string };
type Experience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  description?: string;
  tech?: string;
};
type Profile = {
  name?: string;
  headline?: string;
  summary?: string;
  skills?: string;
  projects?: Project[];
  experiences?: Experience[];
};

export default function CvDocument({
  profile,
  chosenProjects,
  chosenExperiences,
  target,
}: {
  profile: Profile;
  chosenProjects: Project[];
  chosenExperiences: Experience[];
  target: { jobTitle?: string; company?: string; jobDescription?: string };
}) {
  const styles = StyleSheet.create({
    page: { padding: 28, fontSize: 10, fontFamily: 'Helvetica' },
    name: { fontSize: 18, fontWeight: 700 },
    headline: { marginTop: 2, fontSize: 11, color: '#333' },
    section: { marginTop: 12 },
    h2: { fontSize: 12, fontWeight: 700, marginBottom: 6, borderBottom: '1 solid #000' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    bold: { fontWeight: 700 },
    bullet: { marginLeft: 10, marginBottom: 3 },
    small: { fontSize: 9, color: '#333' },
  });

  const skillList = (profile.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View>
          <Text style={styles.name}>{profile.name || ''}</Text>
          <Text style={styles.headline}>
            {profile.headline || ''}
            {target.company || target.jobTitle
              ? ` • Target: ${[target.jobTitle, target.company].filter(Boolean).join(' @ ')}`
              : ''}
          </Text>
        </View>

        {/* Summary */}
        {profile.summary ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Summary</Text>
            <Text>{profile.summary}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {skillList.length ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Skills</Text>
            <Text>{skillList.join(' · ')}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {chosenExperiences.length ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Experience</Text>
            {chosenExperiences.map((x, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{x.title}</Text>
                  <Text style={styles.small}>
                    {[x.start, x.end || 'Present'].filter(Boolean).join(' — ')}
                  </Text>
                </View>
                <Text style={styles.small}>{x.company}</Text>
                {x.description ? <Text style={styles.bullet}>• {x.description}</Text> : null}
                {x.tech ? <Text style={styles.bullet}>• Tech: {x.tech}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Projects */}
        {chosenProjects.length ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Projects</Text>
            {chosenProjects.map((p, i) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={styles.bold}>{p.name}</Text>
                {p.link ? <Text style={styles.small}>{p.link}</Text> : null}
                {p.description ? <Text style={styles.bullet}>• {p.description}</Text> : null}
                {p.tech ? <Text style={styles.bullet}>• Tech: {p.tech}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* (Optional) Job description at end for ATS context */}
        {target.jobDescription ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Target Job Description (for tailoring)</Text>
            <Text style={styles.small}>{target.jobDescription}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
