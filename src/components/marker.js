const { Component, h } = require('preact');

const styles = require('./marker.scss');

class Marker extends Component {
  constructor(props) {
    super(props);

    this.ref = this.ref.bind(this);
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    if (!this.element) return;
    if (!this.props.marker.nodes) return;

    this.props.marker.nodes.forEach(node => {
      this.element.removeChild(node);
    });
  }

  render() {
    const { reference, className } = this.props;

    return (
      <div ref={reference} className={`${styles.wrapper} ${className || ''}`}>
        <div className={`u-richtext-invert ${styles.detail}`} ref={this.ref} />
      </div>
    );
  }

  ref(element) {
    if (!element) return;
    if (!this.props.marker.nodes) return;

    this.element = element;
    this.props.marker.nodes.forEach(node => {
      this.element.appendChild(node);
    });
  }
}

module.exports = Marker;
