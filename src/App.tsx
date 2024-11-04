import { useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { useDraggable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Componente que representa um item arrastável
export function Item(props) {
  const { attributes, listeners, setNodeRef, transform, active, over } = useDraggable({
    id: props.id, // ID do item arrastável
  });
  
  // Estilo para o item baseado na transformação do arrasto
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  console.log("active ITEM: ", active); // Log do estado ativo do item
  console.log("over ITEM: ", over); // Log do estado de sobreposição do item

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className='h-[50px] bg-zinc-100 w-fit p-4 ml-4' >
      {props.children} {/* Renderiza o conteúdo do item */}
    </div >
  );
}

// Componente que representa uma linha que pode conter itens
export function Linha(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: props.id });

  // Estilo para a linha baseado na transformação e se está sendo sobreposta
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
    borderColor: isOver ? 'green' : undefined,
    color: isOver ? 'green' : undefined,
  };

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style} className='h-20 border-2 m-4 border-dashed flex items-center p-4'>
      {props.children} {/* Renderiza o conteúdo da linha */}
    </div>
  );
}

// Tipos para os itens e linhas
type Item = {
  idItem: string,
  conteudo: any
}

type Linha = {
  idLinha: string,
  items: Item[]
}

// Componente principal do aplicativo
export default function App() {
  const [linhas, setLinhas] = useState<Linha[]>([] as Linha[]); // Estado para armazenar as linhas
  const [isVisible, setIsVisible] = useState(false); // Estado para controlar a visibilidade

  // Função para adicionar uma nova linha
  function addLinha() {
    setLinhas((prevLinhas) => [...prevLinhas, {
      idLinha: `linha-${Math.random().toFixed(2)}`, // Gera um ID único para a nova linha
      items: [
        {
          idItem: `item-${Math.random().toFixed(2)}`, // Gera um ID único para o item
          conteudo: <span>{`Conteúdo ${String(Math.random().toFixed(2))}`}</span> // Conteúdo do item
        }
      ],
    }]); // Adiciona uma nova linha com um ID único
  }

  return (
    <DndContext
      collisionDetection={closestCenter} // Estratégia de detecção de colisão
      onDragStart={handleDragStart} // Função chamada ao iniciar o arrasto
      onDragEnd={handleDragEnd} // Função chamada ao finalizar o arrasto
    >
      <button
        className='p-2 bg-emerald-200'
        onClick={addLinha} // Adiciona uma nova linha ao clicar no botão
      >ADD LINHA</button>

      <SortableContext items={linhas.map(linha => linha.idLinha)} strategy={verticalListSortingStrategy}>
        {linhas.map((linha) => (
          <Linha key={linha.idLinha} id={linha.idLinha}>
            {`Linha ${linha.idLinha}`} {/* Renderiza o título da linha */}
            <SortableContext items={linha.items.map(item => item.idItem)}>
              {linha.items.map((item) => (
                <Item key={item.idItem} id={item.idItem}>
                  {item.idItem} {/* Renderiza o ID do item */}
                </Item>
              ))}
            </SortableContext>
          </Linha>
        ))}
      </SortableContext>

      {isVisible && (<Linha id={`linha-${Math.random().toFixed(2)}`}>Nova linha</Linha>)}
    </DndContext>
  );
  // Função chamada ao iniciar o arrasto
  function handleDragStart(event: DragStartEvent) {
    setIsVisible(true); // Torna a nova linha visível
    const { active, } = event; // Obtém informações sobre o item ativo e onde está sobreposto
    console.log("END active: ", active); // Log do item ativo
  }

  // Função chamada ao finalizar o arrasto
  function handleDragEnd(event:DragEndEvent) {
    console.log("event: ", event); // Log do evento de arrasto

    const { over, active } = event; // Obtém informações sobre o item ativo e onde está sobreposto
    console.log("END active: ", active); // Log do item ativo
    console.log("END over: ", over); // Log do item sobreposto

    const oldLinhaIndex = linhas.findIndex(linha => linha.items.some(item => item.idItem === active.id)); // Encontra o índice da linha original
    const newLinhaIndex = linhas.findIndex(linha => linha.idLinha === over?.id); // Encontra o índice da nova linha
    console.log("newLinhaIndex: ", newLinhaIndex); // Log do índice da nova linha

    // Se a nova linha não existir
    if (newLinhaIndex === -1) {
      const itemToMove = linhas[oldLinhaIndex].items.find(item => item.idItem === active.id); // Obtém o item que está sendo movido
      
      // Remove o item da linha original
      const updatedOldLinha = {
        ...linhas[oldLinhaIndex],
        items: linhas[oldLinhaIndex].items.filter(item => item.idItem !== active.id),
      };

      setLinhas((prevLinhas) => {
        const newLinhas = [...prevLinhas, {
          idLinha: over?.id, // ID da nova linha
          items: [
            itemToMove, // Adiciona o item que está sendo movido
          ],
        }];
        
        // Atualiza a linha original
        newLinhas[oldLinhaIndex] = updatedOldLinha;

        // Remove a linha se estiver vazia
        if (updatedOldLinha.items.length === 0) {
          newLinhas.splice(oldLinhaIndex, 1);
        }

        return newLinhas; // Retorna as novas linhas
      });
    }
    
    // Se a linha original e a nova linha existirem e forem diferentes
    if (oldLinhaIndex !== -1 && newLinhaIndex !== -1 && oldLinhaIndex !== newLinhaIndex) {
      const itemToMove = linhas[oldLinhaIndex].items.find(item => item.idItem === active.id); // Obtém o item que está sendo movido

      // Remove o item da linha original
      const updatedOldLinha = {
        ...linhas[oldLinhaIndex],
        items: linhas[oldLinhaIndex].items.filter(item => item.idItem !== active.id),
      };

      // Adiciona o item à nova linha
      const updatedNewLinha = {
        ...linhas[newLinhaIndex],
        items: [...linhas[newLinhaIndex].items, itemToMove],
      };

      // Atualiza o estado com as linhas modificadas
      const newLinhas = [...linhas];
      newLinhas[oldLinhaIndex] = updatedOldLinha; // Atualiza a linha original
      newLinhas[newLinhaIndex] = updatedNewLinha; // Atualiza a nova linha

      // Remove a linha se estiver vazia
      if (updatedOldLinha.items.length === 0) {
        newLinhas.splice(oldLinhaIndex, 1);
      }

      setLinhas(newLinhas); // Atualiza o estado com as novas linhas
    }

    setIsVisible(false); // Torna a nova linha invisível
  }
};