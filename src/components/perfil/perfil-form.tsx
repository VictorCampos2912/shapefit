import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { OBJETIVO_OPCOES, SEXO_OPCOES } from '@/constants/perfil';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ObjetivoTreino, Sexo } from '@/types/perfil';

type DadosFormulario = {
  nome: string;
  pesoKg: number;
  alturaCm: number;
  idade: number;
  sexo: Sexo;
  objetivo: ObjetivoTreino;
};

type PerfilFormProps = {
  onSubmit: (dados: DadosFormulario) => void;
  submitting?: boolean;
};

export function PerfilForm({ onSubmit, submitting = false }: PerfilFormProps) {
  const theme = useTheme();
  const [nome, setNome] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoTreino | null>(null);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);

  function validar(): string[] {
    const faltantes: string[] = [];
    if (nome.trim().length === 0) faltantes.push('nome');
    if (pesoKg.trim().length === 0) faltantes.push('peso');
    if (alturaCm.trim().length === 0) faltantes.push('altura');
    if (idade.trim().length === 0) faltantes.push('idade');
    if (!sexo) faltantes.push('sexo');
    if (!objetivo) faltantes.push('objetivo');
    return faltantes;
  }

  function handleSubmit() {
    const faltantes = validar();
    setCamposFaltantes(faltantes);
    if (faltantes.length > 0 || !sexo || !objetivo) {
      return;
    }
    onSubmit({
      nome: nome.trim(),
      pesoKg: Number(pesoKg),
      alturaCm: Number(alturaCm),
      idade: Number(idade),
      sexo,
      objetivo,
    });
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Criar perfil</ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Nome</ThemedText>
        <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Peso (kg)</ThemedText>
        <TextInput
          style={styles.input}
          value={pesoKg}
          onChangeText={setPesoKg}
          placeholder="Ex: 70"
          keyboardType="decimal-pad"
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Altura (cm)</ThemedText>
        <TextInput
          style={styles.input}
          value={alturaCm}
          onChangeText={setAlturaCm}
          placeholder="Ex: 175"
          keyboardType="decimal-pad"
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Idade</ThemedText>
        <TextInput
          style={styles.input}
          value={idade}
          onChangeText={setIdade}
          placeholder="Ex: 30"
          keyboardType="number-pad"
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Sexo</ThemedText>
        <ThemedView style={styles.opcoesRow}>
          {SEXO_OPCOES.map((opcao) => (
            <Pressable
              key={opcao}
              onPress={() => setSexo(opcao)}
              style={[
                styles.opcaoButton,
                sexo === opcao && { backgroundColor: theme.accentTint, borderColor: theme.accent },
              ]}>
              <ThemedText type="small">{opcao}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="smallBold">Objetivo de treino</ThemedText>
        <ThemedView style={styles.opcoesRow}>
          {OBJETIVO_OPCOES.map((opcao) => (
            <Pressable
              key={opcao}
              onPress={() => setObjetivo(opcao)}
              style={[
                styles.opcaoButton,
                objetivo === opcao && { backgroundColor: theme.accentTint, borderColor: theme.accent },
              ]}>
              <ThemedText type="small">{opcao}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>
      </ThemedView>

      {camposFaltantes.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          Preencha os campos obrigatórios: {camposFaltantes.join(', ')}
        </ThemedText>
      )}

      <Button onPress={handleSubmit} disabled={submitting}>
        {submitting ? 'Salvando…' : 'Salvar perfil'}
      </Button>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  opcoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  opcaoButton: {
    borderWidth: 1,
    borderColor: '#8888',
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
