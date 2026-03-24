import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type ProjectorSlide = {
  id: string;
  title?: string;
  content: string;
  kind?: 'verse' | 'verse-block' | 'stanza' | 'chorus';
};

type Props = {
  slides: ProjectorSlide[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
};

export default function ProjectorView({
  slides,
  currentIndex,
  onPrev,
  onNext,
}: Props) {
  const slide = slides[currentIndex];

  if (!slide) return null;

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {!!slide.title && <Text style={styles.title}>{slide.title}</Text>}
        <Text style={styles.content}>{slide.content}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrev} style={styles.button}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.counter}>
          {currentIndex + 1} / {slides.length}
        </Text>

        <TouchableOpacity onPress={onNext} style={styles.button}>
          <Text style={styles.buttonText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: 'space-between',
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  content: {
    color: '#fff',
    fontSize: 38,
    lineHeight: 54,
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.85,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  counter: {
    color: '#aaa',
    fontSize: 16,
  },
});