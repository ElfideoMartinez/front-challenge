import React, { useRef, useState, useEffect } from "react";
import Moveable from "react-moveable";

const App = () => {
  //inicialiar estados
  const [moveableComponents, setMoveableComponents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [images, setImages] = useState([]);

  //useEffect para obtener las imagenes cuando el componente se monta
  useEffect(() => { 
    getImages();
  }, []);

  //funcion para obtener las imagenes y setearlas en el estado
  const getImages = async() => {
    const response=await fetch('https://jsonplaceholder.typicode.com/photos');
    const data=await response.json();
    setImages(data);
  }

  //funcion para agregar un nuevo componente
  const addMoveable = () => {
    
    // Create a new moveable component and add it to the array
    const COLORS = ["red", "blue", "yellow", "green", "purple"];
    //create a random image fit style
    const imageFitStyle=['cover', 'contain', 'fill', 'none', 'scale-down'];

    setMoveableComponents([
      ...moveableComponents,
      {
        id: Math.random().toString(36).substr(2, 9),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        //setea el color stylo de la imagen e imagen aleatoriamete
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        imageFitStyle: imageFitStyle[Math.floor(Math.random()*10)],
        image: images[Math.floor(Math.random()*10)].url,
        updateEnd: true,
      },
    ]);
  };
  //funcion para remover un componente
  const removeMoveable = (id) => {
    // remover el componente del array
    const updatedMoveables = moveableComponents.filter((moveable) => moveable.id !== id);
    setMoveableComponents(updatedMoveables);

  }
  //funcion para actualizar el componente
  const updateMoveable = (id, newComponent, updateEnd = false) => {
    //localizar el componente con el id pasado y actualizarlo
    const updatedMoveables = moveableComponents.map((moveable, i) => {
      if (moveable.id === id) {
        return { id, ...newComponent, updateEnd };
      }
      //de no ser el componente que se esta actualizando, se retorna el mismo componente
      return moveable;
    });
    setMoveableComponents(updatedMoveables);
  };

  const handleResizeStart = (index, e) => {
    // Check if the resize is coming from the left handle
    const [handlePosX, handlePosY] = e.direction;
    // 0 => center
    // -1 => top or left
    // 1 => bottom or right

    // -1, -1
    // -1, 0
    // -1, 1
    if (handlePosX === -1) {
      // Save the initial left and width values of the moveable component
      const initialLeft = e.left;
      const initialWidth = e.width;

      // Set up the onResize event handler to update the left value based on the change in width
      e.set([initialLeft, null, initialWidth, null]);

    }
  };

  return (
    <main style={{ height : "100vh", width: "100vw" }}>
      <button onClick={addMoveable} >Add Moveable1</button>
      {/*boton para remover un componente solo si hay componentes en el array*/}
      <button disabled={moveableComponents.length<=0} onClick={()=>removeMoveable(selected)}>remove Moveable1</button>
      <div
        id="parent"
        style={{
          position: "relative",
          background: "black",
          height: "80vh",
          width: "80vw",
        }}
      >
        {/*mapea los componentes añadidos */}
        {moveableComponents.map((item, index) => (
          <Component
            {...item}
            key={index}
            updateMoveable={updateMoveable}
            handleResizeStart={handleResizeStart}
            setSelected={setSelected}
            isSelected={selected === item.id}
            image={images[index].url}
            imageFitStyle={images[index].imageFitStyle}
          />
        ))}
      </div>
    </main>
  );
};

export default App;

const Component = ({
  updateMoveable,
  top,
  left,
  width,
  height,
  index,
  color,
  id,
  setSelected,
  isSelected = false,
  updateEnd,
  image,
  imageFitStyle,

}) => {
   //get parent div height and width
   const parentDiv = document.getElementById("parent");
   const parentHeight = parentDiv.offsetHeight;
   const parentWidth = parentDiv.offsetWidth;
  const ref = useRef();
  

  const [nodoReferencia, setNodoReferencia] = useState({
    top,
    left,
    width,
    height,
    index,
    color,
    id,
  });

  let parent = document.getElementById("parent");
  let parentBounds = parent?.getBoundingClientRect();
  
  const onResize = async (e) => {
    // ACTUALIZAR ALTO Y ANCHO
    let newWidth = e.width;
    let newHeight = e.height; 

    // const positionMaxTop = top + newHeight;
    // const positionMaxLeft = left + newWidth;
    const newTop = e.clientY;
    const newLeft = e.clientX;

    if (newTop > parentBounds?.height)
      newHeight = parentBounds?.height + top;
    if (newLeft > parentBounds?.width)
      newWidth = parentBounds?.width + left;
    //actualizar el componente que corresponde con el id
    updateMoveable(id, {
      newTop,
      newLeft,
      width: newWidth,
      height: newHeight,
      color,
      image,
    });

    // ACTUALIZAR NODO REFERENCIA
    const beforeTranslate = e.drag.beforeTranslate;

    ref.current.style.width = `${e.width}px`;
    ref.current.style.height = `${e.height}px`;

    let translateX = beforeTranslate[0];
    let translateY = beforeTranslate[1];

    ref.current.style.transform = `translate(${translateX}px, ${translateY}px)`;

    setNodoReferencia({
      ...nodoReferencia,
      translateX,
      translateY,
      top: top + translateY < 0 ? 0 : top + translateY,
      left: left + translateX < 0 ? 0 : left + translateX,
    });
  };

  const onResizeEnd = async (e) => {
    let newWidth = e.lastEvent?.width;
    let newHeight = e.lastEvent?.height;

    const positionMaxTop = top + newHeight;
    const positionMaxLeft = left + newWidth;

    if (positionMaxTop > parentBounds?.height)
      newHeight = parentBounds?.height - top;
    if (positionMaxLeft > parentBounds?.width)
      newWidth = parentBounds?.width - left;

    const { lastEvent } = e;
    const { drag } = lastEvent;
    const { beforeTranslate } = drag;

    const absoluteTop = top + beforeTranslate[1];
    const absoluteLeft = left + beforeTranslate[0];

    updateMoveable(
      id,
      {
        top: absoluteTop,
        left: absoluteLeft,
        width: newWidth,
        height: newHeight,
        color,
      },
      true
    );
  };

  return (
    <>
      <div
        ref={ref}
        className="draggable"
        id={"component-" + id}
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: imageFitStyle,
          backgroundRepeat: "no-repeat",
          backgroundSize: `${width}px ${height}px`,
          position: "absolute",
          top: top,
          left: left,
          width: width,
          height: height,
        }}
        onClick={() => setSelected(id)}
      />
      <Moveable
        target={isSelected && ref.current}
        resizable
        draggable
        onDrag={(e) => {
          //dont let the element go out of the parent div
          if (e.top < 0) e.top = 0;
          if (e.left < 0) e.left = 0;
          if (e.top > parentHeight - height) e.top = parentHeight - height;
          if (e.left > parentWidth - width) e.left = parentWidth - width;
          updateMoveable(id, {
            top: e.top,
            left: e.left,
            width,
            height,
            color,
          });
        }}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        keepRatio={false}
        throttleResize={1}
        renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
        edge={false}
        zoom={1}
        origin={false}
        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
      >
      </Moveable>
    </>
  );
};
