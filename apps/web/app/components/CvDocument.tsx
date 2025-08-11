'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type Project = { name: string; link?: string; tech?: string; description?: string[] };
type Experience = {
  company: string;
  title: string;
  start?: string;
  end?: string;
  description?: string[];
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
    h2: {
      fontSize: 12,
      fontWeight: 700,
      marginBottom: 6,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: '#000',
      borderBottomStyle: 'solid',
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    bold: { fontWeight: 700 },
    small: { fontSize: 9, color: '#333' },
    bulletList: { marginTop: 3, marginLeft: 8 },
    bulletItem: { marginBottom: 2 },
  });

  const skillList = (profile.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const toLines = (v?: string | string[]) =>
    Array.isArray(v) ? v.filter(Boolean).map(String) : typeof v === 'string' && v.trim() ? [v] : [];

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
            {chosenExperiences.map((x, i) => {
              const lines = toLines(x.description);
              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <View style={styles.row}>
                    <Text style={styles.bold}>{x.title}</Text>
                    <Text style={styles.small}>
                      {[x.start, x.end || 'Present'].filter(Boolean).join(' — ')}
                    </Text>
                  </View>
                  <Text style={styles.small}>{x.company}</Text>
                  {lines.length ? (
                    <View style={styles.bulletList}>
                      {lines.map((line, bi) => (
                        <Text key={bi} style={styles.bulletItem}>
                          • {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {x.tech ? <Text style={[styles.small, { marginTop: 2 }]}>Tech: {x.tech}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Projects */}
        {chosenProjects.length ? (
          <View style={styles.section}>
            <Text style={styles.h2}>Projects</Text>
            {chosenProjects.map((p, i) => {
              const lines = toLines(p.description);
              return (
                <View key={i} style={{ marginBottom: 8 }}>
                  <Text style={styles.bold}>{p.name}</Text>
                  {p.link ? <Text style={styles.small}>{p.link}</Text> : null}
                  {lines.length ? (
                    <View style={styles.bulletList}>
                      {lines.map((line, bi) => (
                        <Text key={bi} style={styles.bulletItem}>
                          • {line}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  {p.tech ? <Text style={[styles.small, { marginTop: 2 }]}>Tech: {p.tech}</Text> : null}
                </View>
              );
            })}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
