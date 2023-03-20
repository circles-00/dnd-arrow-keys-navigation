import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const menu = {
    width: '35px',
    height: '5px',
    backgroundColor: 'black',
    margin: '6px 0'
};
// fake data generator
const getItems = (count, offset = 0) =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `item-${k + offset}`,
        content: `item ${k + offset}`
    }));

// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

const grid = 8;

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250
});

const App = () => {
    const [state, setState] = useState({
        items: getItems(5),
        selected: getItems(5, 5)
    })

    /**
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    const id2List = {
        droppable: 'items',
        droppable2: 'selected'
    };

    const getList = id => state[id2List[id]];

    const onDragEnd = result => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                getList(source.droppableId),
                source.index,
                destination.index
            );

            let state = { items };

            if (source.droppableId === 'droppable2') {
                state = { selected: items };
            }

            setState(state);
        } else {
            const result = move(
                getList(source.droppableId),
                getList(destination.droppableId),
                source,
                destination
            );

            setState({
                items: result.droppable,
                selected: result.droppable2
            });
        }
    };

    // Make array of refs for the first elements of each column 
    const refs = useRef([])
    const [currentColumn, setCurrentColumn] = useState(0)
    const [snapshots, setSnapshots] = useState([])


    useEffect(() => {
        window.addEventListener('keydown', (e) => {
            // If space is pressed, ignore all keydown events
            if (snapshots.some(snapshot => snapshot)) {
                return
            }

            // Move right
            if (e.key === 'ArrowRight' && refs.current.length > 0 && currentColumn + 1 < refs.current.length) {
                refs.current[currentColumn + 1].focus()
                setCurrentColumn(currentColumn + 1)
            }

            // Move left
            if (e.key === 'ArrowLeft' && refs.current.length > 0 && currentColumn - 1 >= 0) {
                refs.current[currentColumn - 1].focus()
                setCurrentColumn(currentColumn - 1)
            }

        })
    }, [currentColumn, refs])

    useEffect(() => {
        if (refs.current.length > 0 && refs.current[0]) {
            refs.current[0].focus()
        }
    }, [refs])


    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    return (
        <DragDropContext onDragEnd={onDragEnd}>

            <Droppable droppableId="droppable">
                {(provided, snapshot) => {
                    // TODO: Make this generic, depending on how many columns there are, you would probably map the droppables.
                    if (snapshots.length < 1)
                        setSnapshots([...snapshots, snapshot])

                    return <div
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}>
                        <RenderDroppable items={state.items} refs={refs} />
                        {provided.placeholder}
                    </div>
                }}
            </Droppable>
            <Droppable droppableId="droppable2">
                {(provided, snapshot) => {
                    // TODO: Make this generic, depending on how many columns there are, you would probably map the droppables.
                    if (snapshots.length < 2)
                        setSnapshots([...snapshots, snapshot.isDraggingOver])
                    return <div
                        ref={provided.innerRef}
                        style={getListStyle(snapshot.isDraggingOver)}>
                        {state.selected.map((item, index) => (
                            <Draggable
                                key={item.id}
                                draggableId={item.id}
                                index={index}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={el => {
                                            if (index === 0) {
                                                refs.current[1] = el
                                            }
                                            provided.innerRef(el)
                                        }}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={getItemStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                        )}>
                                        <div
                                            style={{
                                                float: 'right',
                                                marginTop: '-9px'
                                            }}>
                                            <div style={menu} />
                                            <div style={menu} />
                                            <div style={menu} />
                                        </div>
                                        {item.content}
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                }}
            </Droppable>
        </DragDropContext>
    );
}

const RenderDroppable = ({ items, refs }) => {
    return (items.length > 0 &&
        items.map((item, index) => (
            <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}>
                {(provided, snapshot) => {

                    return <div
                        ref={el => {
                            if (index === 0) {
                                refs.current[0] = el
                            }
                            provided.innerRef(el)
                        }}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                            snapshot.isDragging,
                            provided.draggableProps
                                .style
                        )}>
                        <div
                            style={{
                                float: 'right',
                                marginTop: '-9px'
                            }}>
                            <div style={menu} />
                            <div style={menu} />
                            <div style={menu} />
                        </div>
                        {item.content}
                    </div>
                }}
            </Draggable>
        )))
}

// Put the things into the DOM!
ReactDOM.render(<App />, document.getElementById('root'));
