import { useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native';

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

const TECLADO_NUMERICO_ID = 'perfil-form-teclado-numerico';

export function PerfilForm({ onSubmit, submitting = false }: PerfilFormProps) {
  const theme = useTheme();
  const [nome, setNome] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState<Sexo | null>(null);
  const [objetivo, setObjetivo] = useState<ObjetivoTreino | null>(null);
  const [camposFaltantes, setCamposFaltantes] = useState<string[]>([]);

  const pesoRef = useRef<TextInput>(null);
  const alturaRef = useRef<TextInput>(null);
  const idadeRef = useRef<TextInput>(null);

  // No iOS, os teclados "decimal-pad"/"number-pad" não têm tecla de retorno —
  // sem isso não existe nenhum jeito nativo de avançar ou fechar o teclado
  // nesses 3 campos (bug relatado pelo usuário em teste real no iPhone). A
  // barra de acessório abaixo supre isso; o campo focado decide se o botão
  // avança pro próximo ou fecha o teclado.
  const [campoNumericoFocado, setCampoNumericoFocado] = useState<'peso' | 'altura' | 'idade' | null>(null);

  function handleAcessorioNumerico() {
    if (campoNumericoFocado === 'peso') {
      alturaRef.current?.focus();
    } else if (campoNumericoFocado === 'altura') {
      idadeRef.current?.focus();
    } else {
      Keyboard.dismiss();
    }
  }

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
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ThemedView style={styles.container}>
          <ThemedText type="subtitle">Criar perfil</ThemedText>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Nome</ThemedText>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Seu nome"
              returnKeyType="next"
              onSubmitEditing={() => pesoRef.current?.focus()}
              blurOnSubmit={false}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Peso (kg)</ThemedText>
            <TextInput
              ref={pesoRef}
              style={styles.input}
              value={pesoKg}
              onChangeText={setPesoKg}
              placeholder="Ex: 70"
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => alturaRef.current?.focus()}
              blurOnSubmit={false}
              onFocus={() => setCampoNumericoFocado('peso')}
              inputAccessoryViewID={Platform.OS === 'ios' ? TECLADO_NUMERICO_ID : undefined}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Altura (cm)</ThemedText>
            <TextInput
              ref={alturaRef}
              style={styles.input}
              value={alturaCm}
              onChangeText={setAlturaCm}
              placeholder="Ex: 175"
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => idadeRef.current?.focus()}
              blurOnSubmit={false}
              onFocus={() => setCampoNumericoFocado('altura')}
              inputAccessoryViewID={Platform.OS === 'ios' ? TECLADO_NUMERICO_ID : undefined}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="smallBold">Idade</ThemedText>
            <TextInput
              ref={idadeRef}
              style={styles.input}
              value={idade}
              onChangeText={setIdade}
              placeholder="Ex: 30"
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
              onFocus={() => setCampoNumericoFocado('idade')}
              inputAccessoryViewID={Platform.OS === 'ios' ? TECLADO_NUMERICO_ID : undefined}
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
      </TouchableWithoutFeedback>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={TECLADO_NUMERICO_ID}>
          <ThemedView style={styles.acessorioTeclado}>
            <Pressable onPress={handleAcessorioNumerico} hitSlop={8}>
              <ThemedText type="link">{campoNumericoFocado === 'idade' ? 'Concluído' : 'Próximo'}</ThemedText>
            </Pressable>
          </ThemedView>
        </InputAccessoryView>
      )}
    </>
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
  acessorioTeclado: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    backgroundColor: '#F2F2F7',
  },
});
